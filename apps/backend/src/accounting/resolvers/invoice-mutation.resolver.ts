import { Args, Context, ID, Mutation, Resolver } from '@nestjs/graphql';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { PERMISSIONS } from '../../auth/constants';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { NotFoundGraphQLError } from '../../graphql/errors';
import type { AuthenticatedGraphQLContext } from '../../graphql/graphql.context';
import { OrganizationUnitService } from '../../organization/organization-unit.service';
import { CreateInvoiceInput } from '../inputs/create-invoice.input';
import { InvoiceMapper } from '../mappers';
import { Invoice } from '../models/invoice.model';
import { InvoiceService } from '../services';

@Resolver(() => Invoice)
export class InvoiceMutationResolver {
  constructor(
    private readonly invoiceService: InvoiceService,
    private readonly invoiceMapper: InvoiceMapper,
    private readonly organizationUnitService: OrganizationUnitService,
  ) {}

  @Permissions(PERMISSIONS.ACCOUNTING_MANAGE)
  @Mutation(() => Invoice)
  async createInvoice(
    @Args('input') input: CreateInvoiceInput,
    @Session() session: UserSession,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<Invoice> {
    const organizationId =
      await this.organizationUnitService.findOrganizationIdByUnitId(
        context.organizationUnitId,
      );
    if (!organizationId) {
      throw new NotFoundGraphQLError('Organization not found');
    }

    const invoice = await this.invoiceService.createInvoice(
      organizationId,
      {
        ...input,
        organizationUnitId:
          input.organizationUnitId ?? context.organizationUnitId,
      },
      session.user.id,
    );
    return this.invoiceMapper.toModelOrThrow(invoice);
  }

  @Mutation(() => Invoice)
  async signInvoice(
    @Args('invoiceId', { type: () => ID }) invoiceId: string,
    @Session() session: UserSession,
  ): Promise<Invoice> {
    const invoice = await this.invoiceService.signInvoice(
      invoiceId,
      session.user.id,
    );
    return this.invoiceMapper.toModelOrThrow(invoice);
  }

  @Mutation(() => Invoice)
  async declineInvoice(
    @Args('invoiceId', { type: () => ID }) invoiceId: string,
    @Args('reason') reason: string,
    @Session() session: UserSession,
  ): Promise<Invoice> {
    const invoice = await this.invoiceService.declineInvoice(
      invoiceId,
      session.user.id,
      reason,
    );
    return this.invoiceMapper.toModelOrThrow(invoice);
  }
}
