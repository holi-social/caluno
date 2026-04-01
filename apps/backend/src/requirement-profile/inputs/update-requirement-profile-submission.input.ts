import { InputType, PartialType } from '@nestjs/graphql';
import { CreateRequirementProfileSubmissionInput } from './create-requirement-profile-submission.input';

@InputType()
export class UpdateRequirementProfileSubmissionInput extends PartialType(
  CreateRequirementProfileSubmissionInput,
) {}
