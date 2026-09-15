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
  let yearlyUsageCallArgs: unknown[] = [];
  let rateCallArgs: unknown[] = [];

  const createService = (
    overrides: {
      saveFile?: (args: unknown) => Promise<{ id: string }>;
      rateCents?: number | undefined;
      profileData?: Record<string, unknown>;
      timeEntries?: TimeEntryMock[];
      unit?: Record<string, unknown>;
      yearlyUsage?: {
        usedCents: number;
        limitCents: number;
        remainingCents: number;
      };
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
          findFirst: () =>
            Promise.resolve(overrides.unit ?? { id: 'root-unit' }),
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
      getEffectiveRateCents: (...args: unknown[]) => {
        rateCallArgs = args;
        return Promise.resolve(overrides.rateCents);
      },
      getYearlyUsage: (...args: unknown[]) => {
        yearlyUsageCallArgs = args;
        return Promise.resolve(overrides.yearlyUsage);
      },
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

  it('resolves the rate at the document own unit, not the template unit', async () => {
    rateCallArgs = [];
    const service = createService({ rateCents: 1500 });
    await service.generatePdf(
      contract({
        organizationUnitId: 'sub-unit',
        documentTemplate: {
          ...contract().documentTemplate,
          organizationUnitId: null,
        } as never,
      }),
    );
    expect(rateCallArgs).toEqual(['org-1', 'sub-unit', 'type-1']);
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

  describe('Jahresdeckel already-received amount', () => {
    const resolveValues = (
      service: DocumentRenderingService,
      document: InvoiceWithRelations,
    ): Promise<Record<string, string>> =>
      (
        service as unknown as {
          resolveValues: (
            d: InvoiceWithRelations,
          ) => Promise<Record<string, string>>;
        }
      ).resolveValues(document);

    it('reports the year-to-date sum, excluding the current invoice by id', async () => {
      yearlyUsageCallArgs = [];
      const service = createService({
        rateCents: 1500,
        yearlyUsage: {
          usedCents: 5_000,
          limitCents: 84_000,
          remainingCents: 79_000,
        },
      });

      const values = await resolveValues(service, invoice());

      // 50,00 € is the mocked usage as is, not minus the invoice's own
      // 82,50 € (which would clamp to 0,00 €): the invoice is excluded by id.
      expect(values.already_received_amount).toBe('50,00 €');
      expect(yearlyUsageCallArgs).toEqual([
        'vol-1',
        'type-1',
        2025,
        new Date('2025-01-31'),
        'invoice-1',
      ]);
    });
  });

  describe('resolved org profile values', () => {
    const resolveValues = (
      service: DocumentRenderingService,
      document: ContractWithRelations,
    ): Promise<Record<string, string>> =>
      (
        service as unknown as {
          resolveValues: (
            d: ContractWithRelations,
          ) => Promise<Record<string, string>>;
        }
      ).resolveValues(document);

    it('renders the resolved org postal code the create gate checked', async () => {
      const service = createService({
        unit: {
          id: 'unit-1',
          name: 'Branch',
          address: 'Hauptstraße 1',
          city: 'Berlin',
          zipCode: '10115',
          legalRep: 'Erika Mustermann',
        },
      });

      const values = await resolveValues(service, contract());

      expect(values.org_zip).toBe('10115');
    });

    it('renders a blank postal code as an empty string when the org has none', async () => {
      const service = createService({
        unit: { id: 'unit-1', name: 'Branch' },
      });

      const values = await resolveValues(service, contract());

      expect(values.org_zip).toBe('');
    });
  });
});
