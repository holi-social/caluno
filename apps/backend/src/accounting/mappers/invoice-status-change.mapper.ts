import { Mapper } from '../../shared/decorators/mapper.decorator';
import { BaseMapper } from '../../shared/mapper';
import { InvoiceStatusChange } from '../models/invoice-status-change.model';
import type { InvoiceStatusChangeEntity } from '../schemas/invoice-status-change.schema';

@Mapper({ model: InvoiceStatusChange })
export class InvoiceStatusChangeMapper extends BaseMapper<
  InvoiceStatusChange,
  InvoiceStatusChangeEntity
> {}
