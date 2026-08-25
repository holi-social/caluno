import { Mapper } from '../../shared/decorators/mapper.decorator';
import { BaseMapper } from '../../shared/mapper';
import { ShiftInstanceInvite } from '../models/shift-instance-invite.model';
import type { ShiftInstanceInviteEntity } from '../schemas/shift-instance-invite.schema';

@Mapper({ model: ShiftInstanceInvite })
export class ShiftInstanceInviteMapper extends BaseMapper<
  ShiftInstanceInvite,
  ShiftInstanceInviteEntity
> {}
