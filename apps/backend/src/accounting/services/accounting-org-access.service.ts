import { Inject, Injectable } from '@nestjs/common';
import type { Database } from '../../database/database.module';
import { DATABASE_CONNECTION } from '../../database/database-connection';
import {
  ForbiddenGraphQLError,
  NotFoundGraphQLError,
} from '../../graphql/errors';
import { OrganizationUnitService } from '../../organization/organization-unit.service';

/**
 * Gates the backoffice accounting surface on the organization's
 * `accountingEnabled` flag.
 *
 * The flag has no admin UI (only the fixtures script sets it — see
 * `fixtures.ts`), so a disabled org must not be able to reach any accounting
 * operation even though its owner holds `ACCOUNTING_MANAGE`. The
 * volunteer-facing document queries (`myContracts`, `myInvoices`, signing,
 * previews) intentionally stay ungated: they only ever return documents that
 * exist, and a disabled org can never have any.
 */
@Injectable()
export class AccountingOrgAccessService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: Database,
    private readonly organizationUnitService: OrganizationUnitService,
  ) {}

  async resolveEnabledOrganizationId(
    organizationUnitId: string,
  ): Promise<string> {
    const organizationId =
      await this.organizationUnitService.findOrganizationIdByUnitId(
        organizationUnitId,
      );
    if (!organizationId) {
      throw new NotFoundGraphQLError('Organization not found');
    }

    const organization = await this.db.query.organizations.findFirst({
      where: { id: organizationId },
      columns: { accountingEnabled: true },
    });
    if (!organization?.accountingEnabled) {
      throw new ForbiddenGraphQLError(
        'Accounting is not enabled for this organization',
      );
    }

    return organizationId;
  }
}
