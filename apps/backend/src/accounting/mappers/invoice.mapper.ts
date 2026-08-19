import { Mapper } from '../../shared/decorators/mapper.decorator';
import { BaseMapper } from '../../shared/mapper';
import { Invoice } from '../models/invoice.model';
import type { InvoiceEntity } from '../schemas/invoice.schema';

@Mapper({ model: Invoice })
export class InvoiceMapper extends BaseMapper<Invoice, InvoiceEntity> {}
