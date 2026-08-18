import { Mapper } from '../../shared/decorators/mapper.decorator';
import { BaseMapper } from '../../shared/mapper';
import { CreatedDocument } from '../models/created-document.model';
import type { CreatedDocumentEntity } from '../schemas/created-document.schema';

@Mapper({ model: CreatedDocument })
export class CreatedDocumentMapper extends BaseMapper<
  CreatedDocument,
  CreatedDocumentEntity
> {}
