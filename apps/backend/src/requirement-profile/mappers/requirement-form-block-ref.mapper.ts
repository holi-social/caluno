import { Mapper } from '../../shared/decorators/mapper.decorator';
import { BaseMapper } from '../../shared/mapper';
import { RequirementFormBlockRef } from '../models/requirement-form-block-ref.model';
import type { RequirementFormBlockRefEntity } from '../schemas/requirement-form-block-ref.schema';

@Mapper({ model: RequirementFormBlockRef })
export class RequirementFormBlockRefMapper extends BaseMapper<
  RequirementFormBlockRef,
  RequirementFormBlockRefEntity
> {}
