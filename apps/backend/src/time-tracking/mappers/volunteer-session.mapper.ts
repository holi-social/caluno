import { Mapper } from '../../shared/decorators/mapper.decorator';
import { BaseMapper } from '../../shared/mapper';
import { VolunteerSession } from '../models/volunteer-session.model';
import type { VolunteerSessionEntity } from '../schemas/volunteer-session.schema';

@Mapper({ model: VolunteerSession })
export class VolunteerSessionMapper extends BaseMapper<
  VolunteerSession,
  VolunteerSessionEntity
> {}
