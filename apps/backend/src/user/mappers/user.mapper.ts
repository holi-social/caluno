import type { UserEntity } from '../../auth/schemas/auth.schema';
import { Mapper } from '../../shared/decorators/mapper.decorator';
import { BaseMapper } from '../../shared/mapper';
import { User } from '../models/user.model';

@Mapper({ model: User })
export class UserMapper extends BaseMapper<User, UserEntity> {}
