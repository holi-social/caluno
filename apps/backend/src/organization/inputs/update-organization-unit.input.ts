import { Field, InputType, PartialType } from '@nestjs/graphql';
import { CreateOrganizationUnitInput } from './create-organization-unit.input';

@InputType()
export class UpdateOrganizationUnitInput extends PartialType(
  CreateOrganizationUnitInput,
) {
  @Field(() => String)
  organizationId: string;
}
