import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class UpdateTimeEntryInput {
  @Field(() => String)
  shiftInstanceId: string;

  @Field(() => Date)
  startedAt: Date;

  @Field(() => Date, { nullable: true })
  endedAt: Date | null;

  @Field(() => String, { nullable: true })
  notes: string | null;
}
