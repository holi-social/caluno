import { Mapper } from '../../shared/decorators/mapper.decorator';
import { BaseMapper } from '../../shared/mapper';
import { UserProfile } from '../models/user-profile.model';
import type { UserProfileEntity } from '../schemas/user-profile.schema';

@Mapper({ model: UserProfile })
export class UserProfileMapper extends BaseMapper<
  UserProfile,
  UserProfileEntity
> {}
