import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class ApproveVolunteerSessionInput {
  @Field(() => String)
  id: string;

  @Field(() => String)
  organizationId: string;
}
