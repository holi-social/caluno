import { Mapper } from '../../shared/decorators/mapper.decorator';
import { BaseMapper } from '../../shared/mapper';
import { OrganizationUnit } from '../models/organization-unit.model';
import type { OrganizationUnitEntity } from '../schemas/organization-unit.schema';

@Mapper({ model: OrganizationUnit })
export class OrganizationUnitMapper extends BaseMapper<
  OrganizationUnit,
  OrganizationUnitEntity
> {}
