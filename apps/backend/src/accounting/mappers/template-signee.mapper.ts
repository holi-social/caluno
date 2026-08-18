import { Mapper } from '../../shared/decorators/mapper.decorator';
import { BaseMapper } from '../../shared/mapper';
import { TemplateSignee } from '../models/template-signee.model';
import type { TemplateSigneeEntity } from '../schemas/template-signee.schema';

@Mapper({ model: TemplateSignee })
export class TemplateSigneeMapper extends BaseMapper<
  TemplateSignee,
  TemplateSigneeEntity
> {}
