import { describe, expect, it } from 'bun:test';
import { DocumentKind, ReimbursementTypeKey } from '../enums';
import { AccountingSetupService } from './accounting-setup.service';

function makeService(args: {
  missingOrgFields?: string[];
  templates?: { reimbursementTypeId: string; kind: DocumentKind }[];
  types?: { id: string; key: ReimbursementTypeKey }[];
}) {
  const types = args.types ?? [
    { id: 'type-ehrenamt', key: ReimbursementTypeKey.EHRENAMT },
    { id: 'type-uebungsleiter', key: ReimbursementTypeKey.UEBUNGSLEITER },
  ];
  const db = {
    query: {
      reimbursementTypes: { findMany: async () => types },
      documentTemplates: { findMany: async () => args.templates ?? [] },
    },
  };
  const requirements = {
    missingBaselineOrgProfileSources: async () => args.missingOrgFields ?? [],
  };
  return new AccountingSetupService(db as never, requirements as never);
}

describe('AccountingSetupService.getSetupStatus', () => {
  it('blocks template management while org profile fields are missing', async () => {
    const service = makeService({ missingOrgFields: ['org_address'] });

    const status = await service.getSetupStatus('org-1', 'unit-1');

    expect(status.orgProfileComplete).toBe(false);
    expect(status.missingOrgProfileFields).toEqual(['org_address']);
    expect(status.canManageTemplates).toBe(false);
  });

  it('marks a slot ready only when BOTH its contract and invoice templates exist', async () => {
    // Creating a timesheet auto-drafts a contract, so an invoice template
    // alone is not enough to create anything.
    const service = makeService({
      templates: [
        { reimbursementTypeId: 'type-ehrenamt', kind: DocumentKind.INVOICE },
      ],
    });

    const status = await service.getSetupStatus('org-1', 'unit-1');
    const ehrenamt = status.slots.find((s) => s.reimbursementTypeId === 'type-ehrenamt');

    expect(ehrenamt?.hasInvoiceTemplate).toBe(true);
    expect(ehrenamt?.hasContractTemplate).toBe(false);
    expect(ehrenamt?.ready).toBe(false);
    expect(status.canCreateDocuments).toBe(false);
  });

  it('can create documents once any one slot has both templates', async () => {
    const service = makeService({
      templates: [
        { reimbursementTypeId: 'type-ehrenamt', kind: DocumentKind.CONTRACT },
        { reimbursementTypeId: 'type-ehrenamt', kind: DocumentKind.INVOICE },
      ],
    });

    const status = await service.getSetupStatus('org-1', 'unit-1');

    expect(status.slots.find((s) => s.reimbursementTypeId === 'type-ehrenamt')?.ready).toBe(true);
    expect(status.slots.find((s) => s.reimbursementTypeId === 'type-uebungsleiter')?.ready).toBe(false);
    expect(status.canCreateDocuments).toBe(true);
  });

  it('reports every reimbursement type as a slot even with no templates at all', async () => {
    const service = makeService({});

    const status = await service.getSetupStatus('org-1', 'unit-1');

    expect(status.slots).toHaveLength(2);
    expect(status.slots.every((s) => !s.ready)).toBe(true);
    expect(status.canCreateDocuments).toBe(false);
  });
});
