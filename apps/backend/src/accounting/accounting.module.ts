import { Module } from '@nestjs/common';
import { AccountingService } from './accounting.service';

@Module({
  providers: [AccountingService],
})
export class AccountingModule {}
