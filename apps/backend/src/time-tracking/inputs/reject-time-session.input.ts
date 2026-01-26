import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class RejectTimeSessionInput {
  @Field(() => String)
  id: string;

  @Field(() => String)
  organizationId: string;

  @Field(() => String, { nullable: true })
  rejectionReason: string | null;
}
