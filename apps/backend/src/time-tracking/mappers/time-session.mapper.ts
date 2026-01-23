import { Mapper } from '../../shared/decorators/mapper.decorator';
import { BaseMapper } from '../../shared/mapper';
import { TimeSession } from '../models/time-session.model';
import type { TimeSessionEntity } from '../schemas/time-session.schema';

@Mapper({ model: TimeSession })
export class TimeSessionMapper extends BaseMapper<
  TimeSession,
  TimeSessionEntity
> {}
