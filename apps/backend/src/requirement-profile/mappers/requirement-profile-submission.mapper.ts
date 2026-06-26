import { Mapper } from '../../shared/decorators/mapper.decorator';
import { BaseMapper } from '../../shared/mapper';
import { RequirementProfileSubmission } from '../models/requirement-profile-submission.model';
import type { RequirementProfileSubmissionEntity } from '../schemas/requirement-profile-submission.schema';

@Mapper({ model: RequirementProfileSubmission })
export class RequirementProfileSubmissionMapper extends BaseMapper<
  RequirementProfileSubmission,
  RequirementProfileSubmissionEntity
> {}
