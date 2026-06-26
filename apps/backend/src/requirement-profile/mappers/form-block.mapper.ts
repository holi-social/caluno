import { Mapper } from '../../shared/decorators/mapper.decorator';
import { BaseMapper } from '../../shared/mapper';
import { FormBlock } from '../models/form-block.model';
import type { FormBlockEntity } from '../schemas/form-block.schema';

@Mapper({ model: FormBlock })
export class FormBlockMapper extends BaseMapper<FormBlock, FormBlockEntity> {}
