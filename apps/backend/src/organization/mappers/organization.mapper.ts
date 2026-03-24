import { Mapper } from '../../shared/decorators/mapper.decorator';
import { BaseMapper } from '../../shared/mapper';
import {
  Organization,
  OrganizationPublicInfo,
} from '../models/organization.model';
import type { OrganizationEntity } from '../schemas/organization.schema';

@Mapper({ model: Organization })
export class OrganizationMapper extends BaseMapper<
  Organization,
  OrganizationEntity
> {}

@Mapper({ model: OrganizationPublicInfo })
export class OrganizationPublicInfoMapper extends BaseMapper<
  OrganizationPublicInfo,
  OrganizationEntity
> {}
