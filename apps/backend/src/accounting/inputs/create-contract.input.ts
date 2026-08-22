import { Field, ID, InputType } from '@nestjs/graphql';

@InputType()
export class CreateContractInput {
  // Omit to resolve the org-wide default template; set to target a specific
  // unit's template override.
  @Field(() => ID, { nullable: true })
  organizationUnitId?: string | null;

  @Field(() => ID)
  volunteerId!: string;

  @Field(() => ID)
  reimbursementTypeId!: string;

  @Field(() => Date)
  periodStart!: Date;

  @Field(() => Date)
  periodEnd!: Date;
}
