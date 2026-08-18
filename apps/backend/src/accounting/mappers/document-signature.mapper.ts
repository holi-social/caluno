import { Mapper } from '../../shared/decorators/mapper.decorator';
import { BaseMapper } from '../../shared/mapper';
import { DocumentSignature } from '../models/document-signature.model';
import type { DocumentSignatureEntity } from '../schemas/document-signature.schema';

@Mapper({ model: DocumentSignature })
export class DocumentSignatureMapper extends BaseMapper<
  DocumentSignature,
  DocumentSignatureEntity
> {}
