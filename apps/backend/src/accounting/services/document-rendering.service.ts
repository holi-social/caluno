import { Inject, Injectable, Logger } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import PDFDocument from 'pdfkit';
import type { Database } from '../../database/database.module';
import { DATABASE_CONNECTION } from '../../database/database-connection';
import * as schema from '../../database/schema';
import { UserProfileService } from '../../requirement-profile/services/user-profile.service';
import { FilePurpose } from '../../storage/enums';
import { FileService } from '../../storage/services/file.service';
import type {
  ContractWithRelations,
  InvoiceWithRelations,
} from '../accounting.types';
import {
  PROFILE_SOURCE_TO_PROFILE_KEY,
  type TemplateBlockShape,
  type TemplateBodyShape,
  type TemplateFieldShape,
  type TemplateLineShape,
} from './document-template.types';
import { ReimbursementRateService } from './reimbursement-rate.service';

type RenderableDocument = ContractWithRelations | InvoiceWithRelations;

const EUR = '€';

/**
 * Renders a fully-signed contract or invoice to a PDF and stores it as a
 * file, attaching the fileId to the document row. The PDF carries the
 * document's own template text (blocks and lines with their bound values
 * resolved), the org identity, and the signature seats with names and dates.
 */
@Injectable()
export class DocumentRenderingService {
  private readonly logger = new Logger(DocumentRenderingService.name);

  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: Database,
    private readonly userProfileService: UserProfileService,
    private readonly reimbursementRateService: ReimbursementRateService,
    private readonly fileService: FileService,
  ) {}

  /**
   * Renders, stores and attaches the PDF. Never throws — a rendering failure
   * only logs, so signing still succeeds and the download stays unavailable
   * until the PDF actually exists.
   */
  async renderAndAttachPdf(
    document: RenderableDocument,
    actorUserId: string,
  ): Promise<string | null> {
    try {
      const template = document.documentTemplate;
      if (!template) {
        throw new Error('Document is missing its template');
      }
      const bytes = await this.generatePdf(document);
      const isContract = 'contractStatus' in document;
      const organizationUnitId =
        template.organizationUnitId ??
        (await this.resolveOrgRootUnitId(template.organizationId));

      const file = await this.fileService.saveGeneratedFile({
        organizationUnitId,
        filename: `${isContract ? 'Vereinbarung' : 'Stundennachweis'}-${document.id.slice(0, 8)}.pdf`,
        mimeType: 'application/pdf',
        bytes,
        uploadedByUserId: actorUserId,
        purpose: FilePurpose.DOCUMENT,
      });

      const table = isContract ? schema.contracts : schema.invoices;
      await this.db
        .update(table)
        .set({ fileId: file.id })
        .where(eq(table.id, document.id));

      return file.id;
    } catch (error) {
      this.logger.error(
        `Failed to render PDF for document ${document.id}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return null;
    }
  }

  async generatePdf(document: RenderableDocument): Promise<Buffer> {
    const template = document.documentTemplate;
    if (!template) {
      throw new Error('Document is missing its template');
    }
    const resolved = await this.resolveValues(document);
    const body = (template.body ?? {}) as TemplateBodyShape;
    const fieldValues = this.buildFieldValueMap(body, resolved);
    const tableRows =
      'invoiceTimeEntries' in document
        ? await this.resolveInvoiceTableRows(document)
        : undefined;

    return new Promise<Buffer>((resolve, reject) => {
      const pdf = new PDFDocument({ size: 'A4', margin: 48 });
      const chunks: Buffer[] = [];
      pdf.on('data', (chunk: Buffer) => chunks.push(chunk));
      pdf.on('end', () => resolve(Buffer.concat(chunks)));
      pdf.on('error', reject);

      this.renderHeader(pdf, body, fieldValues);
      this.renderBlocks(pdf, body, fieldValues, tableRows);
      this.renderClosing(pdf, body, fieldValues);
      this.renderSignatures(pdf, document, resolved);
      pdf.end();
    });
  }

  private renderHeader(
    pdf: PDFKit.PDFDocument,
    body: TemplateBodyShape,
    fieldValues: Record<string, string>,
  ): void {
    const title = (body.header?.titleLines ?? []).join(' ');
    if (title) {
      pdf.fontSize(16).font('Helvetica-Bold').text(title, { align: 'center' });
    }
    for (const metaLine of body.header?.metaLines ?? []) {
      if (metaLine.enabled === false) continue;
      pdf
        .fontSize(9)
        .font('Helvetica')
        .text(this.resolveLine(metaLine, fieldValues), {
          align: 'right',
          lineGap: 1,
        });
    }
    if (body.header?.orgIdentityLine) {
      pdf
        .moveDown(0.5)
        .fontSize(10)
        .font('Helvetica')
        .text(this.resolveLine(body.header.orgIdentityLine, fieldValues), {
          align: 'center',
        });
    }
    pdf.moveDown(1);
    pdf
      .moveTo(48, pdf.y)
      .lineTo(pdf.page.width - 48, pdf.y)
      .stroke();
    pdf.moveDown(0.75);
  }

  private renderBlocks(
    pdf: PDFKit.PDFDocument,
    body: TemplateBodyShape,
    fieldValues: Record<string, string>,
    tableRows: string[][] | undefined,
  ): void {
    for (const block of body.blocks ?? []) {
      if (block.enabled === false) continue;
      if (block.kind === 'table') {
        this.renderTableBlock(pdf, block, tableRows);
        continue;
      }
      if (block.title) {
        pdf.fontSize(12).font('Helvetica-Bold').text(block.title);
        pdf.moveDown(0.25);
      }
      // Note blocks carry a single `line`; text blocks a `lines` array.
      const lines = block.line ? [block.line] : (block.lines ?? []);
      for (const line of lines) {
        if (line.enabled === false) continue;
        const text = this.resolveLine(line, fieldValues).trim();
        if (text) {
          pdf.fontSize(11).font('Helvetica').text(text, { lineGap: 3 });
          pdf.moveDown(0.25);
        }
      }
      pdf.moveDown(0.5);
    }
  }

  private renderTableBlock(
    pdf: PDFKit.PDFDocument,
    block: TemplateBlockShape,
    tableRows: string[][] | undefined,
  ): void {
    if (block.title) {
      pdf.fontSize(12).font('Helvetica-Bold').text(block.title);
      pdf.moveDown(0.25);
    }
    const columns = block.columns ?? [];
    const rows = tableRows ?? [];
    const pageWidth = pdf.page.width - 96;
    const colWidth = pageWidth / Math.max(columns.length, 1);

    const drawRow = (cells: string[], bold: boolean) => {
      const font = bold ? 'Helvetica-Bold' : 'Helvetica';
      pdf.font(font).fontSize(9);
      const cellY = pdf.y;
      // Compute the tallest cell so the row height fits wrapped text.
      let maxHeight = 14;
      for (const cell of cells) {
        const h = pdf.heightOfString(cell, { width: colWidth - 6 });
        maxHeight = Math.max(maxHeight, h + 4);
      }
      for (let i = 0; i < columns.length; i++) {
        pdf
          .font(font)
          .fontSize(9)
          .text(cells[i] ?? '', 48 + i * colWidth, cellY, {
            width: colWidth - 6,
            lineGap: 1,
          });
      }
      pdf.moveDown(maxHeight / 9 + 0.4);
      const lineY = pdf.y;
      pdf
        .moveTo(48, lineY)
        .lineTo(48 + pageWidth, lineY)
        .stroke();
    };

    drawRow(columns, true);
    for (const row of rows) {
      if (pdf.y > pdf.page.height - 120) pdf.addPage();
      drawRow(row, false);
    }
    pdf.moveDown(0.5);
  }

  private renderClosing(
    pdf: PDFKit.PDFDocument,
    body: TemplateBodyShape,
    fieldValues: Record<string, string>,
  ): void {
    const closing = body.footer?.closingLine;
    if (closing) {
      pdf.moveDown(1);
      pdf
        .fontSize(11)
        .font('Helvetica')
        .text(this.resolveLine(closing, fieldValues));
    }
    if (body.footer?.showSignatures !== false) {
      pdf.moveDown(1.5);
    } else {
      pdf.moveDown(0.5);
    }
  }

  private renderSignatures(
    pdf: PDFKit.PDFDocument,
    document: RenderableDocument,
    resolved: Record<string, string>,
  ): void {
    const seats = [
      {
        label: 'Unterschrift (Freiwillige:r)',
        name: resolved.volunteer_name || '—',
        signedAt: this.signatureDateFor(document, 'VOLUNTEER'),
      },
      {
        label: 'Unterschrift Koordination',
        name: resolved.org_name || '—',
        signedAt: this.signatureDateFor(document, 'PERMISSION_HOLDER'),
      },
    ];

    pdf.fontSize(10).font('Helvetica');
    for (const seat of seats) {
      pdf.text(`${seat.label}: ${seat.name}`);
      pdf.text(seat.signedAt ? `am ${seat.signedAt}` : '_______________', {
        lineGap: 2,
      });
      pdf.moveDown(0.75);
    }
  }

  private signatureDateFor(
    document: RenderableDocument,
    signeeType: string,
  ): string | undefined {
    const signature = document.signatures.find(
      (s) => s.signeeType === signeeType && s.signedAt,
    );
    return signature?.signedAt
      ? this.formatDate(new Date(signature.signedAt))
      : undefined;
  }

  private buildFieldValueMap(
    body: TemplateBodyShape,
    resolved: Record<string, string>,
  ): Record<string, string> {
    const values: Record<string, string> = {};
    const collect = (fields?: TemplateFieldShape[]) => {
      for (const field of fields ?? []) {
        values[field.id] =
          field.value.kind === 'manual-template'
            ? (field.value.value ?? '')
            : (resolved[field.value.source] ?? '');
      }
    };
    if (body.header?.orgIdentityLine) {
      collect(body.header.orgIdentityLine.fields);
    }
    for (const metaLine of body.header?.metaLines ?? []) {
      collect(metaLine.fields);
    }
    for (const block of body.blocks ?? []) {
      if (block.line) {
        collect(block.line.fields);
      }
      for (const line of block.lines ?? []) collect(line.fields);
    }
    if (body.footer?.closingLine) collect(body.footer.closingLine.fields);
    return values;
  }

  /**
   * Replaces the {marker} slots in a template line with the resolved field
   * values. The markers are positional, exactly like the frontend preview:
   * split the text on {…} and interleave the line's fields in order. A field
   * with no value renders as "—" (the same gap convention as the preview).
   */
  private resolveLine(
    line: TemplateLineShape,
    values: Record<string, string>,
  ): string {
    const parts = line.text.split(/\{[^}]+\}/g);
    let result = parts[0] ?? '';
    line.fields.forEach((field, i) => {
      const value = values[field.id];
      result += value === undefined || value === '' ? '—' : value;
      result += parts[i + 1] ?? '';
    });
    return result;
  }

  private async resolveValues(
    document: RenderableDocument,
  ): Promise<Record<string, string>> {
    const template = document.documentTemplate;
    if (!template) {
      throw new Error('Document is missing its template');
    }
    const [rootUnit, volunteer] = await Promise.all([
      'organizationUnit' in document && document.organizationUnit
        ? Promise.resolve(document.organizationUnit)
        : this.db.query.organizationUnits.findFirst({
            where: { id: template.organizationUnitId ?? undefined },
          }),
      this.db.query.users.findFirst({
        where: { id: document.volunteerId },
      }),
    ]);
    const profile = await this.userProfileService.findByUserId(
      document.volunteerId,
    );
    const profileData = (profile?.data ?? {}) as Record<string, unknown>;

    const [firstName, lastName] = this.splitName(volunteer?.name);
    const rateCents = await this.resolveRateCents(
      document,
      template.organizationId,
    );
    const amountCents =
      'totalAmountCents' in document ? document.totalAmountCents : undefined;
    const totalHours =
      'totalHours' in document ? document.totalHours : undefined;

    // Invoice-only computed values: the period range, the yearly budget
    // already used (minus this invoice) and the statutory cap, and the mock
    // document number. These are generation-time, not volunteer-profile data.
    const yearlyUsage =
      'invoiceStatus' in document
        ? await this.reimbursementRateService
            .getYearlyUsage(
              document.volunteerId,
              document.reimbursementTypeId,
              new Date(document.periodStart).getFullYear(),
            )
            .catch(() => undefined)
        : undefined;
    const alreadyReceivedCents = yearlyUsage
      ? Math.max(0, yearlyUsage.usedCents - (amountCents ?? 0))
      : undefined;
    const yearlyLimitCents =
      yearlyUsage?.limitCents ??
      document.reimbursementType?.yearlyLimitCents;

    const str = (value: unknown): string =>
      typeof value === 'string' ? value : '';

    return {
      org_name: rootUnit?.name ?? '',
      org_address: rootUnit?.address ?? '',
      org_city: rootUnit?.city ?? '',
      org_legal_rep: rootUnit?.legalRep ?? '',
      volunteer_name: volunteer?.name ?? '',
      volunteer_first_name: firstName,
      volunteer_last_name: lastName,
      volunteer_address: str(
        profileData[PROFILE_SOURCE_TO_PROFILE_KEY.volunteer_address],
      ),
      volunteer_dob: str(
        profileData[PROFILE_SOURCE_TO_PROFILE_KEY.volunteer_dob],
      ),
      volunteer_iban: str(
        profileData[PROFILE_SOURCE_TO_PROFILE_KEY.volunteer_iban],
      ),
      volunteer_bic: str(
        profileData[PROFILE_SOURCE_TO_PROFILE_KEY.volunteer_bic],
      ),
      hourly_rate: rateCents !== undefined ? this.formatRate(rateCents) : '',
      total_hours: totalHours !== undefined ? `${totalHours}h` : '',
      total_amount:
        amountCents !== undefined ? this.formatEuro(amountCents) : '',
      period_start: this.formatDate(new Date(document.periodStart)),
      period_end: this.formatDate(new Date(document.periodEnd)),
      contract_period: `${this.formatDate(new Date(document.periodStart))} – ${this.formatDate(new Date(document.periodEnd))}`,
      already_received_amount:
        alreadyReceivedCents !== undefined
          ? this.formatEuro(alreadyReceivedCents)
          : '',
      yearly_limit_amount:
        yearlyLimitCents !== undefined ? this.formatEuro(yearlyLimitCents) : '',
      document_number:
        'invoiceStatus' in document
          ? this.formatInvoiceNumber(
              template.invoiceNumberFormat,
              new Date(document.periodStart),
            )
          : '',
      generated_date: this.formatDate(new Date()),
    };
  }

  /**
   * Mock document-number generation — no real sequence counter exists yet, so
   * this only has to look plausible for the chosen format (mirrors the
   * frontend's formatDocumentNumber).
   */
  private formatInvoiceNumber(
    invoiceFormat: string | null | undefined,
    periodStart: Date,
  ): string {
    const yyyy = periodStart.getUTCFullYear();
    const mm = String(periodStart.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(periodStart.getUTCDate()).padStart(2, '0');
    const seq = '001';
    switch (invoiceFormat) {
      case 'date-number':
        return `${yyyy}${mm}${dd}-${seq}`;
      case 'date-kostenstelle-number':
        return `${yyyy}${mm}${dd}-${seq}`;
      case 'compact-date-number':
        return `${String(yyyy).slice(2)}${mm}${dd}${seq}`;
      case 'kostenstelle-month-year-number':
        return `${mm}.${yyyy}-${seq}`;
      default:
        return `${yyyy}${mm}${dd}-${seq}`;
    }
  }

  /** Invoice table rows: task, begin, end, hours, rate — mirroring the frontend's eligible-hours preview. */
  private async resolveInvoiceTableRows(
    document: InvoiceWithRelations,
  ): Promise<string[][]> {
    try {
      const entryIds =
        document.invoiceTimeEntries?.map((e) => e.timeEntryId) ?? [];
      if (entryIds.length === 0) return [];

      const timeEntries = await this.db.query.timeEntries.findMany({
        where: { id: { in: entryIds } },
        with: { shiftInstance: { with: { master: true } } },
      });

      const rateCents = await this.resolveRateCents(
        document,
        document.documentTemplate?.organizationId ?? '',
      );

      return timeEntries.map((entry) => {
        const shiftTitle = entry.shiftInstance?.master?.title;
        const begin = entry.startedAt
          ? this.formatDateTime(new Date(entry.startedAt))
          : '';
        const end = entry.endedAt
          ? this.formatDateTime(new Date(entry.endedAt))
          : '';
        const hours = this.hoursBetween(entry.startedAt, entry.endedAt);
        return [
          shiftTitle ?? entry.notes ?? '',
          begin,
          end,
          `${hours}h`,
          rateCents !== undefined ? `${this.formatRate(rateCents)} €` : '',
        ];
      });
    } catch (error) {
      this.logger.warn(
        `Failed to resolve invoice table rows for ${document.id}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return [];
    }
  }

  private hoursBetween(startedAt: Date | null, endedAt: Date | null): string {
    if (!startedAt || !endedAt) return '';
    const hours = (endedAt.getTime() - startedAt.getTime()) / 3_600_000;
    return `${Math.round(hours * 100) / 100}`.replace('.', ',');
  }

  private async resolveRateCents(
    document: RenderableDocument,
    organizationId: string,
  ): Promise<number | undefined> {
    try {
      const template = document.documentTemplate;
      if (!template) {
        return undefined;
      }
      const organizationUnitId =
        template.organizationUnitId ??
        (await this.resolveOrgRootUnitId(organizationId));
      return await this.reimbursementRateService.getEffectiveRateCents(
        organizationId,
        organizationUnitId,
        document.reimbursementTypeId,
      );
    } catch {
      return undefined;
    }
  }

  private async resolveOrgRootUnitId(
    organizationId: string | null,
  ): Promise<string> {
    if (!organizationId) {
      throw new Error('Organization is missing its id');
    }
    const root = await this.db.query.organizationUnits.findFirst({
      where: { organizationId, parentId: { isNull: true } },
      columns: { id: true },
    });
    if (!root) {
      throw new Error(`No root unit found for organization ${organizationId}`);
    }
    return root.id;
  }

  private splitName(name: string | undefined): [string, string] {
    const parts = (name ?? '').trim().split(/\s+/);
    return [parts[0] ?? '', parts.slice(1).join(' ')];
  }

  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  }

  private formatDateTime(date: Date): string {
    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  /** "10,00" without the € sign — the template text carries "€ pro Stunde" around the marker. */
  private formatRate(cents: number): string {
    return `${(cents / 100).toFixed(2).replace('.', ',')}`;
  }

  private formatEuro(cents: number): string {
    return `${(cents / 100).toFixed(2).replace('.', ',')} ${EUR}`;
  }
}
