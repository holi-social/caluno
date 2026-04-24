import { InputType, OmitType, PartialType } from '@nestjs/graphql';
import { CreateRequirementInput } from './create-requirement.input';

@InputType()
export class UpdateRequirementInput extends PartialType(
  OmitType(CreateRequirementInput, ['organizationId']),
) {}
