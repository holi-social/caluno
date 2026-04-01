import { Mapper } from '../../shared/decorators/mapper.decorator';
import { BaseMapper } from '../../shared/mapper';
import { Requirement } from '../models/requirement.model';
import type { RequirementEntity } from '../schemas/requirement.schema';

@Mapper({ model: Requirement })
export class RequirementMapper extends BaseMapper<
  Requirement,
  RequirementEntity
> {}
