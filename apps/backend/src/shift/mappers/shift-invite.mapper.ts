import { Mapper } from '../../shared/decorators/mapper.decorator';
import { BaseMapper } from '../../shared/mapper';
import { ShiftInvite } from '../models/shift-invite.model';
import type { ShiftInviteEntity } from '../schemas/shift-invite.schema';

@Mapper({ model: ShiftInvite })
export class ShiftInviteMapper extends BaseMapper<
  ShiftInvite,
  ShiftInviteEntity
> {}
