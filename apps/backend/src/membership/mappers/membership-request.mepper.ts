import { Mapper } from '../../shared/decorators/mapper.decorator';
import { BaseMapper } from '../../shared/mapper';
import { MembershipRequest } from '../models/membership-request.model';
import { MembershipRequestEntity } from '../schemas/membership-request.schema';

@Mapper({ model: MembershipRequest })
export class MembershipRequestMapper extends BaseMapper<
  MembershipRequest,
  MembershipRequestEntity
> {}
