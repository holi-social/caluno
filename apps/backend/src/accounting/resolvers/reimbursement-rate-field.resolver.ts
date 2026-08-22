import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { Loader } from '../../graphql/decorators/loader.decorator';
import { Organization } from '../../organization/models/organization.model';
import { ReimbursementRate } from '../models/reimbursement-rate.model';
import { ReimbursementType } from '../models/reimbursement-type.model';
import type { ReimbursementRateEntity } from '../schemas/reimbursement-rate.schema';
import { AccountingOrganizationLoader } from './accounting-organization.loader';
import { AccountingReferenceLoader } from './accounting-reference.loader';

@Resolver(() => ReimbursementRate)
export class ReimbursementRateFieldResolver {
  @ResolveField(() => Organization)
  async organization(
    @Parent() rate: ReimbursementRateEntity,
    @Loader(AccountingOrganizationLoader) loader: AccountingOrganizationLoader,
  ): Promise<Organization> {
    return loader.organizationById.load(rate.organizationId);
  }

  @ResolveField(() => ReimbursementType)
  async reimbursementType(
    @Parent() rate: ReimbursementRateEntity,
    @Loader(AccountingReferenceLoader) loader: AccountingReferenceLoader,
  ): Promise<ReimbursementType> {
    return loader.reimbursementTypeById.load(rate.reimbursementTypeId);
  }
}
