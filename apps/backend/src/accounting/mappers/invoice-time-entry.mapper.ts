import { Mapper } from '../../shared/decorators/mapper.decorator';
import { BaseMapper } from '../../shared/mapper';
import { InvoiceTimeEntry } from '../models/invoice-time-entry.model';
import type { InvoiceTimeEntryEntity } from '../schemas/invoice-time-entry.schema';

@Mapper({ model: InvoiceTimeEntry })
export class InvoiceTimeEntryMapper extends BaseMapper<
  InvoiceTimeEntry,
  InvoiceTimeEntryEntity
> {}
