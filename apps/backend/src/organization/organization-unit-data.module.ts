import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { OrganizationUnitDataService } from './organization-unit-data.service';

@Module({
  imports: [DatabaseModule],
  providers: [OrganizationUnitDataService],
  exports: [OrganizationUnitDataService],
})
export class OrganizationUnitDataModule {}
