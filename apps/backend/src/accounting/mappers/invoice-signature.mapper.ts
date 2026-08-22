import { Mapper } from '../../shared/decorators/mapper.decorator';
import { BaseMapper } from '../../shared/mapper';
import { InvoiceSignature } from '../models/invoice-signature.model';
import type { InvoiceSignatureEntity } from '../schemas/invoice-signature.schema';

@Mapper({ model: InvoiceSignature })
export class InvoiceSignatureMapper extends BaseMapper<
  InvoiceSignature,
  InvoiceSignatureEntity
> {}
