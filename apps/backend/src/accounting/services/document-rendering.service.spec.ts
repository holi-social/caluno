import { describe, expect, it } from 'bun:test';
import { DocumentRenderingService } from './document-rendering.service';
import type { ContractWithRelations } from '../accounting.types';
import { FilePurpose } from '../../storage/enums';

describe('DocumentRenderingService', () => {
  const createService = (overrides: {
    saveFile?: (args: unknown) => Promise<{ id: string }>;
    rateCents?: number | undefined;
    profileData?: Record<string, unknown>;
  } = {}) => {
    const db = {
      query: {
        organizations: {
          findFirst: () =>
            Promise.resolve({ id: 'org-1', name: 'Playground', address: 'Musterstraße 1' }),
        },
        users: {
          findFirst: () =>
            Promise.resolve({ id: 'vol-1', name: 'Max Mustermann' }),
        },
        organizationUnits: {
          findFirst: () => Promise.resolve({ id: 'root-unit' }),
        },
      },
      update: () => ({ set: () => ({ where: () => Promise.resolve() }) }),
    } as never;
    const userProfileService = {
      findByUserId: () =>
        Promise.resolve({ data: overrides.profileData ?? { address: 'Testweg 2' } }),
    } as never;
    const reimbursementRateService = {
      getEffectiveRateCents: () => Promise.resolve(overrides.rateCents),
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

  const contract = (overrides: Partial<ContractWithRelations> = {}): ContractWithRelations =>
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
                { id: 'org_name', value: { kind: 'bound', source: 'org_name' } },
                { id: 'org_address', value: { kind: 'bound', source: 'org_address' } },
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
                    { id: 'hourly_rate', value: { kind: 'bound', source: 'hourly_rate' } },
                  ],
                },
              ],
            },
          ],
          footer: { closingLine: { id: 'closing', text: 'Vielen Dank', fields: [] } },
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

  it('generatePdf produces a valid PDF buffer', async () => {
    const service = createService({ rateCents: 1500 });
    const buffer = await service.generatePdf(contract());
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
});
