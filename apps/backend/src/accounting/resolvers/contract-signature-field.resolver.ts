import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { Permission } from '../../auth/models/permission.model';
import { Loader } from '../../graphql/decorators/loader.decorator';
import { User } from '../../user/models/user.model';
import { ContractSignature } from '../models/contract-signature.model';
import type { ContractSignatureEntity } from '../schemas/contract-signature.schema';
import { AccountingReferenceLoader } from './accounting-reference.loader';
import { AccountingUserLoader } from './accounting-user.loader';

@Resolver(() => ContractSignature)
export class ContractSignatureFieldResolver {
  @ResolveField(() => Permission, { nullable: true })
  async requiredPermission(
    @Parent() signature: ContractSignatureEntity,
    @Loader(AccountingReferenceLoader) loader: AccountingReferenceLoader,
  ): Promise<Permission | null> {
    if (!signature.requiredPermissionId) {
      return null;
    }
    return loader.permissionById.load(signature.requiredPermissionId);
  }

  @ResolveField(() => User, { nullable: true })
  async signedByUser(
    @Parent() signature: ContractSignatureEntity,
    @Loader(AccountingUserLoader) loader: AccountingUserLoader,
  ): Promise<User | null> {
    if (!signature.signedByUserId) {
      return null;
    }
    return loader.userById.load(signature.signedByUserId);
  }
}
