import { Mapper } from '../../shared/decorators/mapper.decorator';
import { BaseMapper } from '../../shared/mapper';
import { ShiftInstance } from '../models/shift-instance.model';
import type { ShiftInstanceEntity } from '../schemas/shift-instance.schema';

@Mapper({ model: ShiftInstance })
export class ShiftInstanceMapper extends BaseMapper<
  ShiftInstance,
  ShiftInstanceEntity
> {}
