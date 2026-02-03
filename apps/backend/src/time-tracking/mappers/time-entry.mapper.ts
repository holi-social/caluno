import { Mapper } from '../../shared/decorators/mapper.decorator';
import { BaseMapper } from '../../shared/mapper';
import { TimeEntry } from '../models/time-entry.model';
import type { TimeEntryEntity } from '../schemas/time-entry.schema';

@Mapper({ model: TimeEntry })
export class TimeEntryMapper extends BaseMapper<TimeEntry, TimeEntryEntity> {}
