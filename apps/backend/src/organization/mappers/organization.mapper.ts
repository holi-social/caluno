import { Mapper } from '../../shared/decorators/mapper.decorator';
import { BaseMapper } from '../../shared/mapper';
import { Organization } from '../models/organization.model';
import type { OrganizationEntity } from '../schemas/organization.schema';

@Mapper({ model: Organization })
export class OrganizationMapper extends BaseMapper<
  Organization,
  OrganizationEntity
> {}
