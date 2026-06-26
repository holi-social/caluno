import { Mapper } from '../../shared/decorators/mapper.decorator';
import { BaseMapper } from '../../shared/mapper';
import { RequirementProfile } from '../models/requirement-profile.model';
import type { RequirementProfileEntity } from '../schemas/requirement-profile.schema';

@Mapper({ model: RequirementProfile })
export class RequirementProfileMapper extends BaseMapper<
  RequirementProfile,
  RequirementProfileEntity
> {}
