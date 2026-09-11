import { Inject, Injectable } from '@nestjs/common';
import type { Database } from '../../database/database.module';
import { DATABASE_CONNECTION } from '../../database/database-connection';
import { ContractStatus, InvoiceStatus } from '../enums';
import type { ContractEntity } from '../schemas/contract.schema';
import type { InvoiceEntity } from '../schemas/invoice.schema';
import { ContractService } from './contract.service';
import { InvoiceService } from './invoice.service';

export interface MyDocumentsGroupEntity {
  membershipId: string;
  organizationUnitId: string;
  organizationUnitName: string;
  organizationName: string;
  logoUrl: string | null;
  contracts: ContractEntity[];
  invoices: InvoiceEntity[];
}

interface MembershipOrgInfo {
  organizationId: string;
  membershipId: string;
  organizationUnitId: string;
  organizationUnitName: string;
  organizationName: string;
  logoUrl: string | null;
}

/**
 * The volunteer's documents across every organization they belong to, for
 * the cross-org "My documents" page and its action-needed badge. Unlike the
 * org-scoped `myContracts`/`myInvoices` (which resolve the org from the
 * request header), these resolve the user's memberships server-side.
 */
@Injectable()
export class VolunteerDocumentsService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: Database,
    private readonly contractService: ContractService,
    private readonly invoiceService: InvoiceService,
  ) {}

  /** The user's orgs, deduplicated by organization (one membership each). */
  private async findMembershipOrgInfos(
    userId: string,
  ): Promise<MembershipOrgInfo[]> {
    const memberships = await this.db.query.memberships.findMany({
      where: { userId },
      columns: { id: true, organizationUnitId: true },
      with: {
        organizationUnit: {
          columns: {
            id: true,
            name: true,
            logoUrl: true,
            organizationId: true,
          },
          with: {
            organization: { columns: { id: true, name: true } },
          },
        },
      },
    });

    const byOrganization = new Map<string, MembershipOrgInfo>();
    for (const membership of memberships) {
      const unit = membership.organizationUnit;
      if (unit?.organization == null) continue;
      if (byOrganization.has(unit.organizationId)) continue;
      byOrganization.set(unit.organizationId, {
        organizationId: unit.organizationId,
        membershipId: membership.id,
        organizationUnitId: unit.id,
        organizationUnitName: unit.name,
        organizationName: unit.organization.name,
        logoUrl: unit.logoUrl,
      });
    }
    return [...byOrganization.values()];
  }

  async findMyDocumentsGroups(
    userId: string,
  ): Promise<MyDocumentsGroupEntity[]> {
    const orgs = await this.findMembershipOrgInfos(userId);
    const groups: MyDocumentsGroupEntity[] = [];

    for (const org of orgs) {
      const [contracts, invoices] = await Promise.all([
        this.contractService.findContractsForOrganization(org.organizationId, {
          volunteerId: userId,
        }),
        this.invoiceService.findInvoicesForOrganization(org.organizationId, {
          volunteerId: userId,
        }),
      ]);
      groups.push({
        membershipId: org.membershipId,
        organizationUnitId: org.organizationUnitId,
        organizationUnitName: org.organizationUnitName,
        organizationName: org.organizationName,
        logoUrl: org.logoUrl,
        contracts,
        invoices,
      });
    }

    return groups;
  }

  /**
   * Summary across all of the user's orgs: total documents (any state — used
   * to decide whether the "My documents" entry exists at all) and the ones
   * currently needing their signature (the badge — the only state that asks
   * anything of them, accounting-volunteer-documents).
   */
  async getMyDocumentSummary(
    userId: string,
  ): Promise<{ total: number; pending: number }> {
    const orgs = await this.findMembershipOrgInfos(userId);
    let total = 0;
    let pending = 0;

    for (const org of orgs) {
      const [contracts, invoices] = await Promise.all([
        this.contractService.findContractsForOrganization(org.organizationId, {
          volunteerId: userId,
        }),
        this.invoiceService.findInvoicesForOrganization(org.organizationId, {
          volunteerId: userId,
        }),
      ]);
      total += contracts.length + invoices.length;
      pending +=
        contracts.filter(
          (c) =>
            c.contractStatus === ContractStatus.AWAITING_VOLUNTEER_SIGNATURE,
        ).length +
        invoices.filter(
          (i) => i.invoiceStatus === InvoiceStatus.AWAITING_VOLUNTEER_SIGNATURE,
        ).length;
    }

    return { total, pending };
  }
}
