import { InputType, PartialType } from '@nestjs/graphql';
import { CreateRequirementFulfillmentInput } from './create-requirement-fulfillment.input';

@InputType()
export class UpdateRequirementFulfillmentInput extends PartialType(
  CreateRequirementFulfillmentInput,
) {}
