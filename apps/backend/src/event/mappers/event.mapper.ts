import { Mapper } from '../../shared/decorators/mapper.decorator';
import { BaseMapper } from '../../shared/mapper';
import { Event } from '../models/event.model';
import type { EventEntity } from '../schemas/event.schema';

@Mapper({ model: Event })
export class EventMapper extends BaseMapper<Event, EventEntity> {}
