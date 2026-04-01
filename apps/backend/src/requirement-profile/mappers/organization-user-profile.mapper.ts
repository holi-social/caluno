import { Mapper } from '../../shared/decorators/mapper.decorator';
import { BaseMapper } from '../../shared/mapper';
import { OrganizationUserProfile } from '../models/organization-user-profile.model';
import type { OrganizationUserProfileEntity } from '../schemas/organization-user-profile.schema';

@Mapper({ model: OrganizationUserProfile })
export class OrganizationUserProfileMapper extends BaseMapper<
  OrganizationUserProfile,
  OrganizationUserProfileEntity
> {}
