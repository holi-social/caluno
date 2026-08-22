import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { Loader } from '../../graphql/decorators/loader.decorator';
import { NotFoundGraphQLError } from '../../graphql/errors';
import { User } from '../../user/models/user.model';
import {
  ContractSignatureMapper,
  ContractStatusChangeMapper,
  DocumentTemplateMapper,
  ReimbursementTypeMapper,
} from '../mappers';
import { Contract } from '../models/contract.model';
import { ContractSignature } from '../models/contract-signature.model';
import { ContractStatusChange } from '../models/contract-status-change.model';
import { DocumentTemplate } from '../models/document-template.model';
import { ReimbursementType } from '../models/reimbursement-type.model';
import type { ContractEntity } from '../schemas/contract.schema';
import type { ContractSignatureEntity } from '../schemas/contract-signature.schema';
import type { ContractStatusChangeEntity } from '../schemas/contract-status-change.schema';
import type { DocumentTemplateEntity } from '../schemas/document-template.schema';
import type { ReimbursementTypeEntity } from '../schemas/reimbursement-type.schema';
import { AccountingUserLoader } from './accounting-user.loader';
import { ContractLoader } from './contract.loader';

type MaybeWithRelations = ContractEntity & {
  documentTemplate?: DocumentTemplateEntity;
  reimbursementType?: ReimbursementTypeEntity;
  signatures?: ContractSignatureEntity[];
  statusChanges?: ContractStatusChangeEntity[];
};

@Resolver(() => Contract)
export class ContractFieldResolver {
  constructor(
    private readonly documentTemplateMapper: DocumentTemplateMapper,
    private readonly reimbursementTypeMapper: ReimbursementTypeMapper,
    private readonly contractSignatureMapper: ContractSignatureMapper,
    private readonly contractStatusChangeMapper: ContractStatusChangeMapper,
  ) {}

  @ResolveField(() => DocumentTemplate)
  async documentTemplate(
    @Parent() contract: MaybeWithRelations,
    @Loader(ContractLoader) loader: ContractLoader,
  ): Promise<DocumentTemplate> {
    if (contract.documentTemplate) {
      return this.documentTemplateMapper.toModelOrThrow(
        contract.documentTemplate,
      );
    }
    const full = await loader.contractWithRelationsById.load(contract.id);
    return this.documentTemplateMapper.toModelOrThrow(full.documentTemplate);
  }

  @ResolveField(() => ReimbursementType)
  async reimbursementType(
    @Parent() contract: MaybeWithRelations,
    @Loader(ContractLoader) loader: ContractLoader,
  ): Promise<ReimbursementType> {
    if (contract.reimbursementType) {
      return this.reimbursementTypeMapper.toModelOrThrow(
        contract.reimbursementType,
      );
    }
    const full = await loader.contractWithRelationsById.load(contract.id);
    return this.reimbursementTypeMapper.toModelOrThrow(full.reimbursementType);
  }

  @ResolveField(() => [ContractSignature])
  async signatures(
    @Parent() contract: MaybeWithRelations,
    @Loader(ContractLoader) loader: ContractLoader,
  ): Promise<ContractSignature[]> {
    if (contract.signatures) {
      return this.contractSignatureMapper.toArray(contract.signatures);
    }
    const full = await loader.contractWithRelationsById.load(contract.id);
    return this.contractSignatureMapper.toArray(full.signatures);
  }

  @ResolveField(() => [ContractStatusChange])
  async statusChanges(
    @Parent() contract: MaybeWithRelations,
    @Loader(ContractLoader) loader: ContractLoader,
  ): Promise<ContractStatusChange[]> {
    if (contract.statusChanges) {
      return this.contractStatusChangeMapper.toArray(contract.statusChanges);
    }
    const full = await loader.contractWithRelationsById.load(contract.id);
    return this.contractStatusChangeMapper.toArray(full.statusChanges);
  }

  @ResolveField(() => User)
  async volunteer(
    @Parent() contract: ContractEntity,
    @Loader(AccountingUserLoader) loader: AccountingUserLoader,
  ): Promise<User> {
    const user = await loader.userById.load(contract.volunteerId);
    if (!user) {
      throw new NotFoundGraphQLError(
        `Volunteer with ID ${contract.volunteerId} not found`,
      );
    }
    return user;
  }

  @ResolveField(() => User, { nullable: true })
  async declinedByUser(
    @Parent() contract: ContractEntity,
    @Loader(AccountingUserLoader) loader: AccountingUserLoader,
  ): Promise<User | null> {
    if (!contract.declinedByUserId) {
      return null;
    }
    return loader.userById.load(contract.declinedByUserId);
  }
}
