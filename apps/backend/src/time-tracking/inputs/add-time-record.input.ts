import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class AddTimeRecordInput {
  @Field(() => String)
  sessionId: string;

  @Field(() => Date)
  startedAt: Date;

  @Field(() => Date)
  endedAt: Date;

  @Field(() => String, { nullable: true })
  notes: string | null;
}
