import { Injectable, Scope } from '@nestjs/common';
import DataLoader from 'dataloader';
import { RegisterLoader } from '../../graphql/interceptors';
import type { InvoiceWithRelations } from '../accounting.types';
import { InvoiceService } from '../services';
import { settleEach } from './settle-each';

@RegisterLoader()
@Injectable({ scope: Scope.REQUEST })
export class InvoiceLoader {
  constructor(private readonly invoiceService: InvoiceService) {}

  // Backfills documentTemplate/reimbursementType/signatures/statusChanges/
  // invoiceTimeEntries for invoices fetched via a list query, which don't
  // come with those relations eager-loaded the way findInvoice() does.
  public readonly invoiceWithRelationsById = new DataLoader<
    string,
    InvoiceWithRelations
  >((ids) => settleEach(ids, (id) => this.invoiceService.findInvoice(id)));
}
