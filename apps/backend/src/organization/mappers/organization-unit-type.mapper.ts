import { Mapper } from '../../shared/decorators/mapper.decorator';
import { BaseMapper } from '../../shared/mapper';
import { OrganizationUnitType } from '../models/organization-unit-type.model';
import type { OrganizationUnitTypeEntity } from '../schemas/organization-unit-type.schema';

@Mapper({ model: OrganizationUnitType })
export class OrganizationUnitTypeMapper extends BaseMapper<
  OrganizationUnitType,
  OrganizationUnitTypeEntity
> {}
