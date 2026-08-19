import { Mapper } from '../../shared/decorators/mapper.decorator';
import { BaseMapper } from '../../shared/mapper';
import { InvoiceEvent } from '../models/invoice-event.model';
import type { InvoiceEventEntity } from '../schemas/invoice-event.schema';

@Mapper({ model: InvoiceEvent })
export class InvoiceEventMapper extends BaseMapper<
  InvoiceEvent,
  InvoiceEventEntity
> {}
