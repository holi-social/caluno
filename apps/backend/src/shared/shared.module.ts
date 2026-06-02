import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { OrgAccessService } from './org-access.service';

@Module({
  imports: [DatabaseModule],
  providers: [OrgAccessService],
  exports: [OrgAccessService],
})
export class SharedModule {}
