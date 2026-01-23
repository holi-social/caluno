import { Mapper } from '../../shared/decorators/mapper.decorator';
import { BaseMapper } from '../../shared/mapper';
import { TimeRecord } from '../models/time-record.model';
import type { TimeRecordEntity } from '../schemas/time-record.schema';

@Mapper({ model: TimeRecord })
export class TimeRecordMapper extends BaseMapper<
  TimeRecord,
  TimeRecordEntity
> {}
