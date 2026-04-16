import { InputType, PartialType } from '@nestjs/graphql';
import { CreateRequirementInput } from './create-requirement.input';

@InputType()
export class UpdateRequirementInput extends PartialType(
  CreateRequirementInput,
) {}
