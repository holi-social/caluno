import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { Permission } from '../../auth/models/permission.model';
import { Loader } from '../../graphql/decorators/loader.decorator';
import { TemplateSignee } from '../models/template-signee.model';
import type { TemplateSigneeEntity } from '../schemas/template-signee.schema';
import { AccountingReferenceLoader } from './accounting-reference.loader';

@Resolver(() => TemplateSignee)
export class TemplateSigneeFieldResolver {
  @ResolveField(() => Permission, { nullable: true })
  async requiredPermission(
    @Parent() signee: TemplateSigneeEntity,
    @Loader(AccountingReferenceLoader) loader: AccountingReferenceLoader,
  ): Promise<Permission | null> {
    if (!signee.requiredPermissionId) {
      return null;
    }
    return loader.permissionById.load(signee.requiredPermissionId);
  }
}
