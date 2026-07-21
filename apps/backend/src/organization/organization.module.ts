import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { MembershipModule } from '../membership/membership.module';
import { NotificationModule } from '../notification/notification.module';
import { RequirementProfileModule } from '../requirement-profile/requirement-profile.module';
import { StorageModule } from '../storage/storage.module';
import { OrganizationMapper } from './mappers/organization.mapper';
import { OrganizationUnitMapper } from './mappers/organization-unit.mapper';
import { OrganizationUnitTypeMapper } from './mappers/organization-unit-type.mapper';
import { OrganizationService } from './organization.service';
import { OrganizationUnitService } from './organization-unit.service';
import { OrganizationUnitDataModule } from './organization-unit-data.module';
import {
  OrganizationFieldResolver,
  OrganizationLoader,
  OrganizationMutationResolver,
  OrganizationQueryResolver,
  OrganizationUnitFieldResolver,
  OrganizationUnitMutationResolver,
  OrganizationUnitQueryResolver,
} from './resolvers';

@Module({
  imports: [
    AuthModule,
    DatabaseModule,
    MembershipModule,
    NotificationModule,
    OrganizationUnitDataModule,
    RequirementProfileModule,
    StorageModule,
  ],
  providers: [
    OrganizationService,
    OrganizationUnitService,
    OrganizationQueryResolver,
    OrganizationMutationResolver,
    OrganizationFieldResolver,
    OrganizationLoader,
    OrganizationUnitQueryResolver,
    OrganizationUnitMutationResolver,
    OrganizationUnitFieldResolver,
    OrganizationMapper,
    OrganizationUnitMapper,
    OrganizationUnitTypeMapper,
  ],
  exports: [
    OrganizationService,
    OrganizationUnitService,
    OrganizationMapper,
    OrganizationUnitMapper,
  ],
})
export class OrganizationModule {}
