import { describe, expect, it } from 'bun:test';
import { ReimbursementTypeKey } from '@repo/data';
import {
  documentCreationBlockedFor,
  documentCreationBlocker,
  templateReadinessByPauschale,
  templateSetupBlocker,
} from './setup-status';

const slot = (key: ReimbursementTypeKey, ready: boolean) => ({
  reimbursementTypeId: `id-${key}`,
  reimbursementTypeKey: key,
  hasContractTemplate: ready,
  hasInvoiceTemplate: ready,
  ready,
});

const slotWith = (
  key: ReimbursementTypeKey,
  hasContractTemplate: boolean,
  hasInvoiceTemplate: boolean,
) => ({
  reimbursementTypeId: `id-${key}`,
  reimbursementTypeKey: key,
  hasContractTemplate,
  hasInvoiceTemplate,
  ready: hasContractTemplate && hasInvoiceTemplate,
});

const status = (
  overrides: Partial<Parameters<typeof templateSetupBlocker>[0]> = {},
) =>
  ({
    orgProfileComplete: true,
    missingOrgProfileFields: [],
    canCreateDocuments: true,
    slots: [
      slot(ReimbursementTypeKey.Ehrenamt, true),
      slot(ReimbursementTypeKey.Uebungsleiter, true),
    ],
    ...overrides,
  }) as NonNullable<Parameters<typeof templateSetupBlocker>[0]>;

describe('templateSetupBlocker', () => {
  it('is null while the status is still loading', () => {
    // Nothing is known yet, so nothing is blocked — the alert must not flash.
    expect(templateSetupBlocker(undefined)).toBeNull();
  });

  it('reports the missing org fields when the org profile is incomplete', () => {
    expect(
      templateSetupBlocker(
        status({
          orgProfileComplete: false,
          missingOrgProfileFields: ['org_address', 'org_city'],
        }),
      ),
    ).toEqual({
      kind: 'org-profile',
      missingFields: ['org_address', 'org_city'],
    });
  });

  it('is null when the org profile is complete', () => {
    expect(templateSetupBlocker(status())).toBeNull();
  });
});

describe('documentCreationBlocker', () => {
  it('is null while the status is still loading', () => {
    expect(documentCreationBlocker(undefined)).toBeNull();
  });

  it('reports the org profile first when both gates are unmet', () => {
    // Templates cannot be authored until the org profile is filled, so sending
    // the admin to the template builder would dead-end them.
    expect(
      documentCreationBlocker(
        status({
          orgProfileComplete: false,
          missingOrgProfileFields: ['org_address'],
          canCreateDocuments: false,
          slots: [
            slot(ReimbursementTypeKey.Ehrenamt, false),
            slot(ReimbursementTypeKey.Uebungsleiter, false),
          ],
        }),
      ),
    ).toEqual({ kind: 'org-profile', missingFields: ['org_address'] });
  });

  it('names the Pauschale types whose templates are incomplete', () => {
    expect(
      documentCreationBlocker(
        status({
          canCreateDocuments: false,
          slots: [
            slot(ReimbursementTypeKey.Ehrenamt, false),
            slot(ReimbursementTypeKey.Uebungsleiter, false),
          ],
        }),
      ),
    ).toEqual({ kind: 'templates', pauschalen: ['ehrenamt', 'uebungsleiter'] });
  });

  it('names only the not-ready slot when one slot is ready', () => {
    expect(
      documentCreationBlocker(
        status({
          canCreateDocuments: false,
          slots: [
            slot(ReimbursementTypeKey.Ehrenamt, true),
            slot(ReimbursementTypeKey.Uebungsleiter, false),
          ],
        }),
      ),
    ).toEqual({ kind: 'templates', pauschalen: ['uebungsleiter'] });
  });

  it('is null when canCreateDocuments is true', () => {
    expect(
      documentCreationBlocker(status({ canCreateDocuments: true })),
    ).toBeNull();
  });

  it('is null when there is no unready slot to name', () => {
    expect(
      documentCreationBlocker(status({ canCreateDocuments: false, slots: [] })),
    ).toBeNull();
  });
});

describe('templateReadinessByPauschale', () => {
  it('is empty while the status is still loading', () => {
    expect(templateReadinessByPauschale(undefined)).toEqual({});
  });

  it('maps each slot to its contract/invoice template state', () => {
    expect(
      templateReadinessByPauschale(
        status({
          slots: [
            slotWith(ReimbursementTypeKey.Ehrenamt, true, true),
            slotWith(ReimbursementTypeKey.Uebungsleiter, false, true),
          ],
        }),
      ),
    ).toEqual({
      ehrenamt: { contract: true, invoice: true },
      uebungsleiter: { contract: false, invoice: true },
    });
  });
});

describe('documentCreationBlockedFor', () => {
  it('blocks a contract when only the contract template is missing', () => {
    const readiness = templateReadinessByPauschale(
      status({
        slots: [slotWith(ReimbursementTypeKey.Uebungsleiter, false, true)],
      }),
    );
    expect(
      documentCreationBlockedFor(readiness, 'uebungsleiter', 'contract'),
    ).toBe(true);
  });

  it('allows a contract when the contract template exists', () => {
    const readiness = templateReadinessByPauschale(
      status({
        slots: [slotWith(ReimbursementTypeKey.Uebungsleiter, true, false)],
      }),
    );
    expect(
      documentCreationBlockedFor(readiness, 'uebungsleiter', 'contract'),
    ).toBe(false);
  });

  it('blocks an invoice when either template is missing', () => {
    // An invoice auto-drafts a contract, so it needs both.
    const missingInvoice = templateReadinessByPauschale(
      status({
        slots: [slotWith(ReimbursementTypeKey.Uebungsleiter, true, false)],
      }),
    );
    const missingContract = templateReadinessByPauschale(
      status({
        slots: [slotWith(ReimbursementTypeKey.Uebungsleiter, false, true)],
      }),
    );
    expect(
      documentCreationBlockedFor(missingInvoice, 'uebungsleiter', 'invoice'),
    ).toBe(true);
    expect(
      documentCreationBlockedFor(missingContract, 'uebungsleiter', 'invoice'),
    ).toBe(true);
  });

  it('allows an invoice when both templates exist', () => {
    const readiness = templateReadinessByPauschale(
      status({
        slots: [slotWith(ReimbursementTypeKey.Uebungsleiter, true, true)],
      }),
    );
    expect(
      documentCreationBlockedFor(readiness, 'uebungsleiter', 'invoice'),
    ).toBe(false);
  });

  it('blocks an unknown Pauschale rather than letting it dead-end', () => {
    expect(documentCreationBlockedFor({}, 'uebungsleiter', 'contract')).toBe(
      true,
    );
  });
});
