import { Mapper } from '../../shared/decorators/mapper.decorator';
import { BaseMapper } from '../../shared/mapper';
import { DocumentTemplate } from '../models/document-template.model';
import type { DocumentTemplateEntity } from '../schemas/document-template.schema';

@Mapper({ model: DocumentTemplate })
export class DocumentTemplateMapper extends BaseMapper<
  DocumentTemplate,
  DocumentTemplateEntity
> {}
