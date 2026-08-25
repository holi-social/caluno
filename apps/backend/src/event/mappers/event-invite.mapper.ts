import { Mapper } from '../../shared/decorators/mapper.decorator';
import { BaseMapper } from '../../shared/mapper';
import { EventInvite } from '../models/event-invite.model';
import type { EventInviteEntity } from '../schemas/event-invite.schema';

@Mapper({ model: EventInvite })
export class EventInviteMapper extends BaseMapper<
  EventInvite,
  EventInviteEntity
> {}
