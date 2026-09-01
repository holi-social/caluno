import { Args, Context, ID, Query, Resolver } from '@nestjs/graphql';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { AuthService } from '../../auth/auth.service';
import { PERMISSIONS } from '../../auth/constants';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import {
  ForbiddenGraphQLError,
  NotFoundGraphQLError,
} from '../../graphql/errors';
import type { AuthenticatedGraphQLContext } from '../../graphql/graphql.context';
import { OrganizationUnitService } from '../../organization/organization-unit.service';
import { TimeEntryMapper } from '../../time-tracking/mappers/time-entry.mapper';
import { TimeEntry } from '../../time-tracking/models/time-entry.model';
import { UserMapper } from '../../user/mappers/user.mapper';
import { UserService } from '../../user/user.service';
import type { InvoiceFilter } from '../accounting.types';
import { InvoiceFilterInput } from '../inputs/invoice-filter.input';
import { InvoiceMapper, ReimbursementTypeMapper } from '../mappers';
import { Invoice } from '../models/invoice.model';
import { PendingSignee } from '../models/pending-signee.model';
import { VolunteerNeedsTimesheet } from '../models/volunteer-needs-timesheet.model';
import {
  AccountingOrgAccessService,
  InvoiceService,
  ReimbursementRateService,
} from '../services';

function toInvoiceFilter(
  filter: InvoiceFilterInput | null | undefined,
): InvoiceFilter {
  return {
    volunteerId: filter?.volunteerId ?? undefined,
    reimbursementTypeId: filter?.reimbursementTypeId ?? undefined,
    status: filter?.status ?? undefined,
    periodStart: filter?.periodStart ?? undefined,
    periodEnd: filter?.periodEnd ?? undefined,
  };
}

@Resolver(() => Invoice)
export class InvoiceQueryResolver {
  constructor(
    private readonly invoiceService: InvoiceService,
    private readonly invoiceMapper: InvoiceMapper,
    private readonly timeEntryMapper: TimeEntryMapper,
    private readonly authService: AuthService,
    private readonly organizationUnitService: OrganizationUnitService,
    private readonly accountingOrgAccessService: AccountingOrgAccessService,
    private readonly userMapper: UserMapper,
    private readonly userService: UserService,
    private readonly reimbursementTypeMapper: ReimbursementTypeMapper,
    private readonly reimbursementRateService: ReimbursementRateService,
  ) {}

  @Query(() => Invoice)
  async invoice(
    @Args('id', { type: () => ID }) id: string,
    @Session() session: UserSession,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<Invoice> {
    const invoice = await this.invoiceService.findInvoice(id);
    await this.assertCanViewDocument(invoice.volunteerId, session, context);
    return this.invoiceMapper.toModelOrThrow(invoice);
  }

  @Permissions(PERMISSIONS.ACCOUNTING_MANAGE)
  @Query(() => [Invoice])
  async invoices(
    @Args('filter', { type: () => InvoiceFilterInput, nullable: true })
    filter: InvoiceFilterInput | null | undefined,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<Invoice[]> {
    const organizationId =
      await this.accountingOrgAccessService.resolveEnabledOrganizationId(
        context.organizationUnitId,
      );
    const invoices = await this.invoiceService.findInvoicesForOrganization(
      organizationId,
      toInvoiceFilter(filter),
    );
    return this.invoiceMapper.toArray(invoices);
  }

  @Query(() => [Invoice])
  async myInvoices(
    @Args('filter', { type: () => InvoiceFilterInput, nullable: true })
    filter: InvoiceFilterInput | null | undefined,
    @Session() session: UserSession,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<Invoice[]> {
    const organizationId = await this.resolveOrganizationId(context);
    const invoices = await this.invoiceService.findInvoicesForOrganization(
      organizationId,
      { ...toInvoiceFilter(filter), volunteerId: session.user.id },
    );
    return this.invoiceMapper.toArray(invoices);
  }

  @Query(() => PendingSignee, { nullable: true })
  async pendingInvoiceSignee(
    @Args('invoiceId', { type: () => ID }) invoiceId: string,
    @Session() session: UserSession,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<PendingSignee | null> {
    const invoice = await this.invoiceService.findInvoice(invoiceId);
    await this.assertCanViewDocument(invoice.volunteerId, session, context);
    return this.invoiceService.findPendingInvoiceSignee(invoiceId);
  }

  @Query(() => [TimeEntry])
  async eligibleTimeEntriesForInvoice(
    @Args('volunteerId', { type: () => ID }) volunteerId: string,
    @Args('reimbursementTypeId', { type: () => ID })
    reimbursementTypeId: string,
    @Args('periodStart', { type: () => Date, nullable: true })
    periodStart: Date | null | undefined,
    @Args('periodEnd', { type: () => Date, nullable: true })
    periodEnd: Date | null | undefined,
    @Session() session: UserSession,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<TimeEntry[]> {
    await this.assertCanViewDocument(volunteerId, session, context);
    const entries = await this.invoiceService.findEligibleTimeEntries(
      volunteerId,
      reimbursementTypeId,
      periodStart ?? undefined,
      periodEnd ?? undefined,
    );
    return this.timeEntryMapper.toArray(entries);
  }

  @Permissions(PERMISSIONS.ACCOUNTING_MANAGE)
  @Query(() => [VolunteerNeedsTimesheet])
  async volunteersNeedingTimesheets(
    @Args('periodStart', { type: () => Date, nullable: true })
    periodStart: Date | null | undefined,
    @Args('periodEnd', { type: () => Date, nullable: true })
    periodEnd: Date | null | undefined,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<VolunteerNeedsTimesheet[]> {
    const rows = await this.invoiceService.findVolunteersNeedingTimesheets(
      context.organizationUnitId,
      periodStart ?? undefined,
      periodEnd ?? undefined,
    );
    if (rows.length === 0) return [];

    const [users, reimbursementTypes] = await Promise.all([
      this.userService.findByIds(rows.map((row) => row.volunteerId)),
      this.reimbursementRateService.findReimbursementTypes(),
    ]);
    const userById = new Map(users.map((user) => [user.id, user]));
    const reimbursementTypeById = new Map(
      reimbursementTypes.map((type) => [type.id, type]),
    );

    return rows.map((row) => {
      const user = userById.get(row.volunteerId);
      const reimbursementType = reimbursementTypeById.get(
        row.reimbursementTypeId,
      );
      if (!user) {
        throw new NotFoundGraphQLError(
          `Volunteer with ID ${row.volunteerId} not found`,
        );
      }
      if (!reimbursementType) {
        throw new NotFoundGraphQLError(
          `Reimbursement type with ID ${row.reimbursementTypeId} not found`,
        );
      }
      return {
        volunteer: this.userMapper.toModelOrThrow(user),
        reimbursementType:
          this.reimbursementTypeMapper.toModelOrThrow(reimbursementType),
        eligibleHours: row.eligibleHours,
      };
    });
  }

  private async assertCanViewDocument(
    volunteerId: string,
    session: UserSession,
    context: AuthenticatedGraphQLContext,
  ): Promise<void> {
    if (session.user.id === volunteerId) {
      return;
    }
    const hasPermission = await this.authService.hasRequiredPermissions(
      session.user.id,
      context.organizationUnitId,
      [PERMISSIONS.ACCOUNTING_MANAGE],
    );
    if (!hasPermission) {
      throw new ForbiddenGraphQLError(
        'You do not have permission to view this document',
      );
    }
  }

  private async resolveOrganizationId(
    context: AuthenticatedGraphQLContext,
  ): Promise<string> {
    const organizationId =
      await this.organizationUnitService.findOrganizationIdByUnitId(
        context.organizationUnitId,
      );
    if (!organizationId) {
      throw new NotFoundGraphQLError('Organization not found');
    }
    return organizationId;
  }
}
