import { describe, expect, it } from 'bun:test';
import { ReimbursementTypeKey } from '@repo/data';
import { documentCreationBlocker, templateSetupBlocker } from './setup-status';

const slot = (key: ReimbursementTypeKey, ready: boolean) => ({
  reimbursementTypeId: `id-${key}`,
  reimbursementTypeKey: key,
  hasContractTemplate: ready,
  hasInvoiceTemplate: ready,
  ready,
});

const status = (
  overrides: Partial<Parameters<typeof templateSetupBlocker>[0]> = {},
) =>
  ({
    orgProfileComplete: true,
    missingOrgProfileFields: [],
    canManageTemplates: true,
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
          canManageTemplates: false,
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
          canManageTemplates: false,
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

  it('is null once at least one slot is ready', () => {
    expect(
      documentCreationBlocker(
        status({
          slots: [
            slot(ReimbursementTypeKey.Ehrenamt, true),
            slot(ReimbursementTypeKey.Uebungsleiter, false),
          ],
        }),
      ),
    ).toBeNull();
  });
});
