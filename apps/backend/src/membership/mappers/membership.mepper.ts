import { Mapper } from '../../shared/decorators/mapper.decorator';
import { BaseMapper } from '../../shared/mapper';
import { Membership } from '../models/membership.model';
import type { MembershipEntity } from '../schemas/membership.schema';

@Mapper({ model: Membership })
export class MembershipMapper extends BaseMapper<
  Membership,
  MembershipEntity
> {}
