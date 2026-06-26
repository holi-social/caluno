import { Mapper } from '../../shared/decorators/mapper.decorator';
import { BaseMapper } from '../../shared/mapper';
import { FormBlockField } from '../models/form-block-field.model';
import type { FormBlockFieldEntity } from '../schemas/form-block-field.schema';

@Mapper({ model: FormBlockField })
export class FormBlockFieldMapper extends BaseMapper<
  FormBlockField,
  FormBlockFieldEntity
> {}
