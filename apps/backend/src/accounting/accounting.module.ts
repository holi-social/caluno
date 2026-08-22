import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { OrganizationModule } from '../organization/organization.module';
import './enums/register-graphql-enums';
import {
  ContractService,
  DocumentSigningService,
  DocumentTemplateService,
  InvoiceService,
  ReimbursementRateService,
} from './services';

@Module({
  imports: [DatabaseModule, AuthModule, OrganizationModule],
  providers: [
    ReimbursementRateService,
    DocumentTemplateService,
    DocumentSigningService,
    ContractService,
    InvoiceService,
  ],
  exports: [
    ReimbursementRateService,
    DocumentTemplateService,
    DocumentSigningService,
    ContractService,
    InvoiceService,
  ],
})
export class AccountingModule {}
