import { InputType, PartialType } from '@nestjs/graphql';
import { CreateRequirementSubmissionFulfillmentInput } from './create-requirement-profile-submission.input';

@InputType()
export class UpdateRequirementFulfillmentInput extends PartialType(
  CreateRequirementSubmissionFulfillmentInput,
) {}
