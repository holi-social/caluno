import { Mapper } from '../../shared/decorators/mapper.decorator';
import { BaseMapper } from '../../shared/mapper';
import { DocumentEvent } from '../models/document-event.model';
import type { DocumentEventEntity } from '../schemas/document-event.schema';

@Mapper({ model: DocumentEvent })
export class DocumentEventMapper extends BaseMapper<
  DocumentEvent,
  DocumentEventEntity
> {}
