import { Mapper } from '../../shared/decorators/mapper.decorator';
import { BaseMapper } from '../../shared/mapper';
import { Document } from '../models/document.model';
import type { DocumentEntity } from '../schemas/document.schema';

@Mapper({ model: Document })
export class DocumentMapper extends BaseMapper<Document, DocumentEntity> {}
