import { Mapper } from '../../shared/decorators/mapper.decorator';
import { BaseMapper } from '../../shared/mapper';
import { Permission } from '../models/permission.model';
import type { PermissionEntity } from '../schemas/permission.schema';

@Mapper({ model: Permission })
export class PermissionMapper extends BaseMapper<
  Permission,
  PermissionEntity
> {}
