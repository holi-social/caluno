import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class RejectVolunteerSessionInput {
  @Field(() => String)
  id: string;

  @Field(() => String)
  organizationId: string;

  @Field(() => String, { nullable: true })
  rejectionReason: string | null;
}
