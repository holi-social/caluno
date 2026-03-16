import { Mapper } from '../../shared/decorators/mapper.decorator';
import { BaseMapper } from '../../shared/mapper';
import { Role } from '../models/role.model';
import type { RoleEntity } from '../schemas/role.schema';

@Mapper({ model: Role })
export class RoleMapper extends BaseMapper<Role, RoleEntity> {}
