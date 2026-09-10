import { Inject, Injectable } from '@nestjs/common';
import type { Database } from '../../database/database.module';
import { DATABASE_CONNECTION } from '../../database/database-connection';
import { DocumentKind, type ReimbursementTypeKey } from '../enums';
import { DocumentProfileRequirementService } from './document-profile-requirement.service';

export interface AccountingTemplateSlotStatus {
  reimbursementTypeId: string;
  reimbursementTypeKey: ReimbursementTypeKey;
  hasContractTemplate: boolean;
  hasInvoiceTemplate: boolean;
  /** Both templates present — the precondition for creating either document. */
  ready: boolean;
}

export interface AccountingSetupStatusResult {
  orgProfileComplete: boolean;
  missingOrgProfileFields: string[];
  slots: AccountingTemplateSlotStatus[];
  canManageTemplates: boolean;
  canCreateDocuments: boolean;
}

/**
 * Answers "is this organization ready to do accounting?" for the UI, using the
 * same requirement service the create mutations enforce with — so the advisory
 * check and the enforcing check cannot drift.
 *
 * Gate B pairs contract + invoice per reimbursement type: creating a timesheet
 * auto-drafts a contract (invoice.service.ts calls
 * ContractService.createDraftContract, which resolves the CONTRACT template),
 * so a slot is only usable when BOTH its templates exist.
 */
@Injectable()
export class AccountingSetupService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: Database,
    private readonly documentProfileRequirementService: DocumentProfileRequirementService,
  ) {}

  async getSetupStatus(
    organizationId: string,
    organizationUnitId: string | null,
  ): Promise<AccountingSetupStatusResult> {
    const missingOrgProfileFields =
      await this.documentProfileRequirementService.missingBaselineOrgProfileSources(
        organizationId,
        organizationUnitId,
      );
    const orgProfileComplete = missingOrgProfileFields.length === 0;

    // reimbursementTypes is a global table (exactly EHRENAMT/UEBUNGSLEITER in
    // a migrated database) — no org filter here.
    const types = await this.db.query.reimbursementTypes.findMany();
    // Soft-deleted rows never count, mirroring findActiveTemplate.
    const templates = await this.db.query.documentTemplates.findMany({
      where: { organizationId, isDeleted: false },
    });

    const slots = types.map((type) => {
      const forType = templates.filter(
        (template) => template.reimbursementTypeId === type.id,
      );
      const hasContractTemplate = forType.some(
        (template) => template.kind === DocumentKind.CONTRACT,
      );
      const hasInvoiceTemplate = forType.some(
        (template) => template.kind === DocumentKind.INVOICE,
      );
      return {
        reimbursementTypeId: type.id,
        reimbursementTypeKey: type.key,
        hasContractTemplate,
        hasInvoiceTemplate,
        // Both, always: creating an invoice auto-drafts a contract, which
        // resolves the contract template.
        ready: hasContractTemplate && hasInvoiceTemplate,
      };
    });

    return {
      orgProfileComplete,
      missingOrgProfileFields,
      slots,
      canManageTemplates: orgProfileComplete,
      canCreateDocuments: slots.some((slot) => slot.ready),
    };
  }
}
