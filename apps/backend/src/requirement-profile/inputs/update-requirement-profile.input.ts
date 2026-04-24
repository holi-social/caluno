import { InputType, OmitType, PartialType } from '@nestjs/graphql';
import { CreateRequirementProfileInput } from './create-requirement-profile.input';

@InputType()
export class UpdateRequirementProfileInput extends PartialType(
  OmitType(CreateRequirementProfileInput, ['organizationId']),
) {}
