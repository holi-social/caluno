import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { OrganizationUnitDataModule } from '../organization/organization-unit-data.module';
import { AuthService } from './auth.service';
import { PermissionMapper } from './mappers/permission.mapper';
import { RoleMapper } from './mappers/role.mapper';
import { PermissionQueryResolver } from './resolvers/permission-query.resolver';
import { RoleFieldResolver } from './resolvers/role-field.resolver';
import { RoleMutationResolver } from './resolvers/role-mutation.resolver';
import { RoleQueryResolver } from './resolvers/role-query.resolver';

@Module({
  imports: [DatabaseModule, OrganizationUnitDataModule],
  providers: [
    AuthService,
    RoleFieldResolver,
    RoleMapper,
    PermissionMapper,
    RoleQueryResolver,
    RoleMutationResolver,
    PermissionQueryResolver,
  ],
  exports: [AuthService, PermissionMapper, RoleMapper],
})
export class AuthModule {}
