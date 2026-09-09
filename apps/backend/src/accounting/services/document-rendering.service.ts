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

const AMOUNT_COLUMN = 'Betrag';

/** Human label for the reimbursement type key rendered for the `pauschalen_type` source. */
const PAUSCHALE_TYPE_LABELS: Record<string, string> = {
  EHRENAMT: 'Ehrenamtspauschale',
  UEBUNGSLEITER: 'Übungsleiterpauschale',
};

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
    const fieldValues = this.buildFieldValueMap(
      body,
      resolved,
      document.fieldOverrides ?? {},
    );
    const tableRows =
      'invoiceTimeEntries' in document
        ? await this.resolveInvoiceTableRows(document)
        : undefined;
    const totalAmountCents =
      'totalAmountCents' in document ? document.totalAmountCents : undefined;

    return new Promise<Buffer>((resolve, reject) => {
      const pdf = new PDFDocument({ size: 'A4', margin: 48 });
      const chunks: Buffer[] = [];
      pdf.on('data', (chunk: Buffer) => chunks.push(chunk));
      pdf.on('end', () => resolve(Buffer.concat(chunks)));
      pdf.on('error', reject);

      this.renderHeader(pdf, body, fieldValues);
      this.renderBlocks(pdf, body, fieldValues, tableRows, totalAmountCents);
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
    totalAmountCents: number | undefined,
  ): void {
    for (const block of body.blocks ?? []) {
      if (block.enabled === false) continue;
      if (block.kind === 'table') {
        this.renderTableBlock(pdf, block, tableRows, totalAmountCents);
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
    totalAmountCents: number | undefined,
  ): void {
    if (block.title) {
      pdf.fontSize(12).font('Helvetica-Bold').text(block.title);
      pdf.moveDown(0.25);
    }
    const isInvoiceTable = tableRows !== undefined;
    const baseColumns = block.columns ?? [];
    const columns =
      isInvoiceTable && baseColumns[baseColumns.length - 1] !== AMOUNT_COLUMN
        ? [...baseColumns, AMOUNT_COLUMN]
        : baseColumns;
    const rows = tableRows ?? [];
    const pageWidth = pdf.page.width - 96;
    const colWidth = pageWidth / Math.max(columns.length, 1);
    const left = 48;
    // Vertical whitespace between a row's text and the rule under it, and then
    // between that rule and the next row. Without an explicit gap the rule is
    // drawn against the text (VOLI-1216).
    const rowGap = 6;
    const afterRuleGap = 4;

    const drawRow = (cells: string[], bold: boolean) => {
      const font = bold ? 'Helvetica-Bold' : 'Helvetica';
      pdf.font(font).fontSize(9);
      const rowTop = pdf.y;
      // Compute the tallest cell so the row height fits wrapped text.
      let maxHeight = 14;
      for (const cell of cells) {
        const h = pdf.heightOfString(cell, { width: colWidth - 6 });
        maxHeight = Math.max(maxHeight, h + 4);
      }
      // Draw the cells at explicit column positions. Explicit x/y calls leave
      // pdfkit's cursor parked at the last column, so we reset it to the left
      // margin afterwards — otherwise any content rendered after this table
      // (the "Bereits erhaltene" note, the signatures) would start from that
      // stray x and get crammed against the right edge (VOLI-1216).
      for (let i = 0; i < columns.length; i++) {
        pdf
          .font(font)
          .fontSize(9)
          .text(cells[i] ?? '', left + i * colWidth, rowTop, {
            width: colWidth - 6,
            lineGap: 1,
          });
      }
      pdf.x = pdf.page.margins.left;
      // Place the row's bottom explicitly (not via move-down arithmetic) so
      // the rule never overlaps the text.
      pdf.y = rowTop + maxHeight + rowGap;
      const lineY = pdf.y;
      pdf
        .moveTo(left, lineY)
        .lineTo(left + pageWidth, lineY)
        .stroke();
      pdf.y = lineY + afterRuleGap;
    };

    drawRow(columns, true);
    for (const row of rows) {
      if (pdf.y > pdf.page.height - 120) pdf.addPage();
      drawRow(row, false);
    }
    if (isInvoiceTable && totalAmountCents !== undefined) {
      if (pdf.y > pdf.page.height - 120) pdf.addPage();
      drawRow(this.invoiceTotalRowCells(totalAmountCents), true);
    }
    pdf.moveDown(0.5);
    pdf.x = pdf.page.margins.left;
  }

  private renderClosing(
    pdf: PDFKit.PDFDocument,
    body: TemplateBodyShape,
    fieldValues: Record<string, string>,
  ): void {
    pdf.x = pdf.page.margins.left;
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

    pdf.x = pdf.page.margins.left;
    for (const seat of seats) {
      this.renderSignatureSeat(pdf, seat);
    }
  }

  private renderSignatureSeat(
    pdf: PDFKit.PDFDocument,
    seat: { label: string; name: string; signedAt: string | undefined },
  ): void {
    pdf.fontSize(10).font('Helvetica').text(seat.label);
    pdf.moveDown(0.5);

    const left = pdf.page.margins.left;
    const top = pdf.y;
    const width = 260;
    const height = 34;

    pdf.lineWidth(1);
    if (seat.signedAt) {
      // HelloSign-style: the signing date sits in a gap in the top border —
      // the border stops, shows the short date, then continues.
      pdf.font('Helvetica').fontSize(8);
      const timestamp = seat.signedAt;
      const labelWidth = pdf.widthOfString(timestamp);
      const gapStart = left + 12;
      const gapEnd = gapStart + labelWidth + 6;

      pdf.moveTo(left, top).lineTo(gapStart, top);
      pdf.moveTo(gapEnd, top).lineTo(left + width, top);
      pdf
        .moveTo(left, top)
        .lineTo(left, top + height)
        .lineTo(left + width, top + height)
        .lineTo(left + width, top);
      pdf.stroke();

      pdf
        .font('Helvetica')
        .fontSize(8)
        .text(timestamp, gapStart + 3, top + 3, { lineBreak: false });
    } else {
      pdf
        .moveTo(left, top)
        .lineTo(left + width, top)
        .lineTo(left + width, top + height)
        .lineTo(left, top + height)
        .lineTo(left, top)
        .stroke();
    }

    pdf
      .font('Helvetica')
      .fontSize(11)
      .text(seat.name, left + 10, top + 11, {
        width: width - 20,
      });

    pdf.x = pdf.page.margins.left;
    pdf.y = top + height + 10;
  }

  private invoiceTotalRowCells(totalAmountCents: number): string[] {
    return ['', '', 'Gesamtbetrag', '', '', this.formatEuro(totalAmountCents)];
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
    overrides: Record<string, string>,
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
    for (const [fieldId, value] of Object.entries(overrides)) {
      if (value) {
        values[fieldId] = value;
      }
    }
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
        : this.resolveTemplateOrgUnit(template),
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
    //
    // The "already received" figure is a running calendar-year-to-date sum
    // for the correct Pauschalentyp — Jan 1 of the document's own period's
    // year through that document's own period end (not "today"), so a
    // reissued/regenerated document stays internally consistent with what it
    // originally stated instead of drifting with later invoices.
    const documentPeriodStart = new Date(document.periodStart);
    const documentPeriodEnd = new Date(document.periodEnd);
    const yearlyUsage =
      'invoiceStatus' in document
        ? await this.reimbursementRateService
            .getYearlyUsage(
              document.volunteerId,
              document.reimbursementTypeId,
              documentPeriodStart.getFullYear(),
              documentPeriodEnd,
            )
            .catch((error: unknown) => {
              this.logger.warn(
                `Failed to resolve yearly usage for document ${document.id}: ${
                  error instanceof Error ? error.message : String(error)
                }`,
              );
              return undefined;
            })
        : undefined;
    const alreadyReceivedCents = yearlyUsage
      ? Math.max(0, yearlyUsage.usedCents - (amountCents ?? 0))
      : undefined;
    const yearlyLimitCents =
      yearlyUsage?.limitCents ?? document.reimbursementType?.yearlyLimitCents;
    const alreadyReceivedPeriod =
      'invoiceStatus' in document
        ? `${this.formatDate(new Date(Date.UTC(documentPeriodStart.getFullYear(), 0, 1)))} – ${this.formatDate(documentPeriodEnd)}`
        : undefined;

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
      volunteer_tax_id: str(
        profileData[PROFILE_SOURCE_TO_PROFILE_KEY.volunteer_tax_id],
      ),
      pauschalen_type: document.reimbursementType
        ? (PAUSCHALE_TYPE_LABELS[document.reimbursementType.key] ?? '')
        : '',
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
      already_received_period: alreadyReceivedPeriod ?? '',
      yearly_limit_amount:
        yearlyLimitCents !== undefined ? this.formatEuro(yearlyLimitCents) : '',
      document_number:
        'invoiceStatus' in document
          ? this.formatInvoiceNumber(
              template.invoiceNumberFormat,
              new Date(document.periodStart),
              this.findManualFieldValue(
                (template.body ?? {}) as TemplateBodyShape,
                'kostenstelle',
              ),
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
    kostenstelle: string | undefined,
  ): string {
    const yyyy = periodStart.getUTCFullYear();
    const mm = String(periodStart.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(periodStart.getUTCDate()).padStart(2, '0');
    const seq = '001';
    switch (invoiceFormat) {
      case 'date-number':
        return `${yyyy}${mm}${dd}-${seq}`;
      case 'date-kostenstelle-number':
        return `${yyyy}${mm}${dd}-${kostenstelle ?? '—'}-${seq}`;
      case 'compact-date-number':
        return `${String(yyyy).slice(2)}${mm}${dd}${seq}`;
      case 'kostenstelle-month-year-number':
        return `${kostenstelle ?? '—'}-${mm}.${yyyy}-${seq}`;
      default:
        return `${yyyy}${mm}${dd}-${seq}`;
    }
  }

  private findManualFieldValue(
    body: TemplateBodyShape,
    fieldId: string,
  ): string | undefined {
    const findIn = (fields?: TemplateFieldShape[]): string | undefined => {
      const field = fields?.find(
        (f) => f.id === fieldId && f.value.kind === 'manual-template',
      );
      return field?.value.kind === 'manual-template'
        ? field.value.value
        : undefined;
    };

    const lines: (TemplateLineShape | undefined)[] = [
      body.header?.orgIdentityLine,
      ...(body.header?.metaLines ?? []),
      ...(body.blocks ?? []).flatMap((block) => [
        block.line,
        ...(block.lines ?? []),
      ]),
      body.footer?.closingLine,
    ];
    for (const line of lines) {
      const value = findIn(line?.fields);
      if (value !== undefined) return value;
    }
    return undefined;
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
        const hours = this.hoursBetweenValue(entry.startedAt, entry.endedAt);
        const amountCents =
          hours !== undefined && rateCents !== undefined
            ? Math.round(hours * rateCents)
            : undefined;
        return [
          shiftTitle ?? entry.notes ?? '',
          begin,
          end,
          hours !== undefined ? `${this.formatHours(hours)}h` : '',
          rateCents !== undefined ? `${this.formatRate(rateCents)} €` : '',
          amountCents !== undefined ? this.formatEuro(amountCents) : '',
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

  private hoursBetweenValue(
    startedAt: Date | null,
    endedAt: Date | null,
  ): number | undefined {
    if (!startedAt || !endedAt) return undefined;
    return (endedAt.getTime() - startedAt.getTime()) / 3_600_000;
  }

  private formatHours(hours: number): string {
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

  private async resolveTemplateOrgUnit(
    template: RenderableDocument['documentTemplate'],
  ) {
    const organizationUnitId =
      template?.organizationUnitId ??
      (await this.resolveOrgRootUnitId(template?.organizationId ?? null));
    return this.db.query.organizationUnits.findFirst({
      where: { id: organizationUnitId },
    });
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

  /**
   * Formats a stored period/date boundary in UTC — document periods are
   * calendar-date boundaries (e.g. periodEnd `23:59:59.999Z`), not
   * timezone-local instants, and formatting in the server's local timezone
   * can roll a late-UTC timestamp into the next calendar day (e.g. Jahresdeckel
   * period-end dates would silently drift by a day in timezones ahead of UTC).
   */
  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'UTC',
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
