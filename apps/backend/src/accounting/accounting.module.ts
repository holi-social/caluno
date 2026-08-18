import { Module } from '@nestjs/common';
import './enums/register-graphql-enums';
import { AccountingService } from './accounting.service';

@Module({
  providers: [AccountingService],
})
export class AccountingModule {}
