import { Mapper } from '../../shared/decorators/mapper.decorator';
import { BaseMapper } from '../../shared/mapper';
import { Shift } from '../models/shift.model';
import type { ShiftEntity } from '../schemas/shift.schema';

@Mapper({ model: Shift })
export class ShiftMapper extends BaseMapper<Shift, ShiftEntity> {}
