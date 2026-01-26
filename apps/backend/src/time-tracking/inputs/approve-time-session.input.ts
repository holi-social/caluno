import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class ApproveTimeSessionInput {
  @Field(() => String)
  id: string;

  @Field(() => String)
  organizationId: string;
}
