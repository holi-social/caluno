import { Mapper } from '../../shared/decorators/mapper.decorator';
import { BaseMapper } from '../../shared/mapper';
import { RequirementForm } from '../models/requirement-form.model';
import type { RequirementFormEntity } from '../schemas/requirement-form.schema';

@Mapper({ model: RequirementForm })
export class RequirementFormMapper extends BaseMapper<
  RequirementForm,
  RequirementFormEntity
> {}
