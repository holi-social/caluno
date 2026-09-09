import { describe, expect, it } from 'bun:test';
import { FilePurpose } from '../../storage/enums';
import type {
  ContractWithRelations,
  InvoiceWithRelations,
} from '../accounting.types';
import { DocumentRenderingService } from './document-rendering.service';
import type { TemplateBodyShape } from './document-template.types';

interface TimeEntryMock {
  shiftInstance: { master: { title: string } };
  startedAt: Date | null;
  endedAt: Date | null;
  notes?: string | null;
}

describe('DocumentRenderingService', () => {
  const createService = (
    overrides: {
      saveFile?: (args: unknown) => Promise<{ id: string }>;
      rateCents?: number | undefined;
      profileData?: Record<string, unknown>;
      timeEntries?: TimeEntryMock[];
    } = {},
  ) => {
    const db = {
      query: {
        organizations: {
          findFirst: () =>
            Promise.resolve({
              id: 'org-1',
              name: 'Playground',
              address: 'Musterstraße 1',
            }),
        },
        users: {
          findFirst: () =>
            Promise.resolve({ id: 'vol-1', name: 'Max Mustermann' }),
        },
        organizationUnits: {
          findFirst: () => Promise.resolve({ id: 'root-unit' }),
        },
        timeEntries: {
          findMany: () => Promise.resolve(overrides.timeEntries ?? []),
        },
      },
      update: () => ({ set: () => ({ where: () => Promise.resolve() }) }),
    } as never;
    const userProfileService = {
      findByUserId: () =>
        Promise.resolve({
          data: overrides.profileData ?? { address: 'Testweg 2' },
        }),
    } as never;
    const reimbursementRateService = {
      getEffectiveRateCents: () => Promise.resolve(overrides.rateCents),
      getYearlyUsage: () => Promise.resolve(undefined),
    } as never;
    const fileService = {
      saveGeneratedFile: (args: unknown) =>
        overrides.saveFile
          ? overrides.saveFile(args)
          : Promise.resolve({ id: 'file-1' }),
    } as never;
    return new DocumentRenderingService(
      db,
      userProfileService,
      reimbursementRateService,
      fileService,
    );
  };

  const contract = (
    overrides: Partial<ContractWithRelations> = {},
  ): ContractWithRelations =>
    ({
      id: 'contract-1',
      volunteerId: 'vol-1',
      reimbursementTypeId: 'type-1',
      periodStart: new Date('2025-01-01'),
      periodEnd: new Date('2025-01-31'),
      totalAmountCents: 20000,
      contractStatus: 'ACTIVE',
      documentTemplate: {
        organizationId: 'org-1',
        organizationUnitId: 'unit-1',
        body: {
          header: {
            titleLines: ['Zusatzvereinbarung'],
            orgIdentityLine: {
              id: 'org-line',
              text: '{org_name} — {org_address}',
              fields: [
                {
                  id: 'org_name',
                  value: { kind: 'bound', source: 'org_name' },
                },
                {
                  id: 'org_address',
                  value: { kind: 'bound', source: 'org_address' },
                },
              ],
            },
          },
          blocks: [
            {
              id: 'block-1',
              title: 'Details',
              lines: [
                {
                  id: 'line-1',
                  text: 'Stundensatz: {hourly_rate}',
                  fields: [
                    {
                      id: 'hourly_rate',
                      value: { kind: 'bound', source: 'hourly_rate' },
                    },
                  ],
                },
              ],
            },
          ],
          footer: {
            closingLine: { id: 'closing', text: 'Vielen Dank', fields: [] },
          },
        },
      },
      signatures: [
        {
          signeeType: 'VOLUNTEER',
          signedAt: new Date('2025-02-01T10:00:00Z'),
        },
        {
          signeeType: 'PERMISSION_HOLDER',
          signedAt: new Date('2025-02-02T10:00:00Z'),
        },
      ],
      ...overrides,
    }) as unknown as ContractWithRelations;

  const invoice = (
    overrides: Partial<InvoiceWithRelations> = {},
  ): InvoiceWithRelations =>
    ({
      id: 'invoice-1',
      volunteerId: 'vol-1',
      reimbursementTypeId: 'type-1',
      periodStart: new Date('2025-01-01'),
      periodEnd: new Date('2025-01-31'),
      totalAmountCents: 8250,
      invoiceStatus: 'OPEN',
      documentTemplate: {
        organizationId: 'org-1',
        organizationUnitId: 'unit-1',
        body: {
          header: { titleLines: ['Stundennachweis'] },
          blocks: [
            {
              id: 'table-1',
              kind: 'table',
              title: 'Stundennachweis',
              columns: [
                'Tätigkeit',
                'Beginn',
                'Ende',
                'Stunden gesamt',
                'Stundensatz',
              ],
            },
          ],
          footer: {},
        },
      },
      invoiceTimeEntries: [{ timeEntryId: 'te-1' }, { timeEntryId: 'te-2' }],
      signatures: [],
      ...overrides,
    }) as unknown as InvoiceWithRelations;

  it('generatePdf produces a valid PDF buffer', async () => {
    const service = createService({ rateCents: 1500 });
    const buffer = await service.generatePdf(contract());
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.subarray(0, 5).toString()).toBe('%PDF-');
  });

  it('generatePdf renders an invoice with a valid PDF buffer', async () => {
    const service = createService({
      rateCents: 1500,
      timeEntries: [
        {
          shiftInstance: { master: { title: 'Community Support' } },
          startedAt: new Date('2025-01-10T08:00:00Z'),
          endedAt: new Date('2025-01-10T10:00:00Z'),
          notes: '',
        },
        {
          shiftInstance: { master: { title: 'Food Distribution' } },
          startedAt: new Date('2025-01-11T09:00:00Z'),
          endedAt: new Date('2025-01-11T12:30:00Z'),
          notes: '',
        },
      ],
    });
    const buffer = await service.generatePdf(invoice());
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.subarray(0, 5).toString()).toBe('%PDF-');
  });

  it('renderAndAttachPdf saves the file with the document purpose and returns its id', async () => {
    let saved: unknown;
    const service = createService({
      rateCents: 1500,
      saveFile: (args) => {
        saved = args;
        return Promise.resolve({ id: 'file-42' });
      },
    });
    const fileId = await service.renderAndAttachPdf(contract(), 'actor-1');
    expect(fileId).toBe('file-42');
    expect(saved).toMatchObject({
      organizationUnitId: 'unit-1',
      filename: expect.stringMatching(/^Vereinbarung-contract\.pdf$/),
      mimeType: 'application/pdf',
      uploadedByUserId: 'actor-1',
      purpose: FilePurpose.DOCUMENT,
    });
    expect(saved).toHaveProperty('bytes');
  });

  it('renderAndAttachPdf never throws — returns null when the template is missing', async () => {
    const service = createService();
    const fileId = await service.renderAndAttachPdf(
      contract({ documentTemplate: null }),
      'actor-1',
    );
    expect(fileId).toBeNull();
  });

  describe('buildFieldValueMap', () => {
    const buildFieldValueMap = (
      service: DocumentRenderingService,
      body: TemplateBodyShape,
      resolved: Record<string, string>,
      overrides: Record<string, string>,
    ): Record<string, string> =>
      (
        service as unknown as {
          buildFieldValueMap: (
            body: TemplateBodyShape,
            resolved: Record<string, string>,
            overrides: Record<string, string>,
          ) => Record<string, string>;
        }
      ).buildFieldValueMap(body, resolved, overrides);

    it('prefers an override over the bound-profile value', () => {
      const service = createService();
      const body: TemplateBodyShape = {
        header: {
          orgIdentityLine: {
            id: 'org-line',
            text: '{volunteer_iban}',
            fields: [
              {
                id: 'volunteer_iban',
                value: { kind: 'bound', source: 'volunteer_iban' },
              },
            ],
          },
        },
      };

      const values = buildFieldValueMap(
        service,
        body,
        { volunteer_iban: 'DE00 1111 2222 3333 4444 55' },
        { volunteer_iban: 'DE00 9999 9999 9999 9999 99' },
      );

      expect(values.volunteer_iban).toBe('DE00 9999 9999 9999 9999 99');
    });

    it('prefers an override over a manual-template value', () => {
      const service = createService();
      const body: TemplateBodyShape = {
        header: {
          orgIdentityLine: {
            id: 'org-line',
            text: '{kostenstelle}',
            fields: [
              {
                id: 'kostenstelle',
                value: { kind: 'manual-template', value: '1000' },
              },
            ],
          },
        },
      };

      const values = buildFieldValueMap(
        service,
        body,
        {},
        { kostenstelle: '2000' },
      );

      expect(values.kostenstelle).toBe('2000');
    });
  });

  describe('resolveInvoiceTableRows', () => {
    const resolveInvoiceTableRows = (
      service: DocumentRenderingService,
      document: InvoiceWithRelations,
    ): Promise<string[][]> =>
      (
        service as unknown as {
          resolveInvoiceTableRows: (
            d: InvoiceWithRelations,
          ) => Promise<string[][]>;
        }
      ).resolveInvoiceTableRows(document);

    it('appends a Betrag amount cell per row (rate × hours)', async () => {
      const service = createService({
        rateCents: 1500,
        timeEntries: [
          {
            shiftInstance: { master: { title: 'Community Support' } },
            startedAt: new Date('2025-01-10T08:00:00Z'),
            endedAt: new Date('2025-01-10T10:00:00Z'),
            notes: '',
          },
          {
            shiftInstance: { master: { title: 'Food Distribution' } },
            startedAt: new Date('2025-01-11T09:00:00Z'),
            endedAt: new Date('2025-01-11T12:30:00Z'),
            notes: '',
          },
        ],
      });

      const rows = await resolveInvoiceTableRows(service, invoice());

      expect(rows).toHaveLength(2);
      expect(rows[0]).toHaveLength(6);
      expect(rows[0][5]).toBe('30,00 €');
      expect(rows[1][5]).toBe('52,50 €');
    });

    it('renders an empty amount cell when there is no rate', async () => {
      const service = createService({
        rateCents: undefined,
        timeEntries: [
          {
            shiftInstance: { master: { title: 'Community Support' } },
            startedAt: new Date('2025-01-10T08:00:00Z'),
            endedAt: new Date('2025-01-10T10:00:00Z'),
            notes: '',
          },
        ],
      });

      const rows = await resolveInvoiceTableRows(service, invoice());

      expect(rows[0]).toHaveLength(6);
      expect(rows[0][5]).toBe('');
    });
  });

  describe('invoiceTotalRowCells', () => {
    it('renders a bold Gesamtbetrag row carrying the formatted total amount', () => {
      const service = createService();
      const cells = (
        service as unknown as {
          invoiceTotalRowCells: (totalAmountCents: number) => string[];
        }
      ).invoiceTotalRowCells(8250);

      expect(cells).toEqual(['', '', 'Gesamtbetrag', '', '', '82,50 €']);
    });
  });

  describe('signatureTimestampLine', () => {
    const signatureTimestampLine = (
      service: DocumentRenderingService,
      signedAt: string | undefined,
    ): string =>
      (
        service as unknown as {
          signatureTimestampLine: (signedAt: string | undefined) => string;
        }
      ).signatureTimestampLine(signedAt);

    it('prefixes the signing date with "am"', () => {
      const service = createService();
      expect(signatureTimestampLine(service, '01.02.2025')).toBe(
        'am 01.02.2025',
      );
    });

    it('falls back to a placeholder line when unsigned', () => {
      const service = createService();
      expect(signatureTimestampLine(service, undefined)).toBe(
        '_______________',
      );
    });
  });
});
