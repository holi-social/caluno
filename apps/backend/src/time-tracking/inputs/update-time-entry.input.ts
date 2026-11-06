import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class UpdateTimeEntryInput {
  @Field(() => String, { nullable: true })
  shiftInstanceId?: string | null;

  @Field(() => Date)
  startedAt!: Date;

  @Field(() => Date, { nullable: true })
  endedAt?: Date | null;

  @Field(() => String, { nullable: true })
  notes?: string | null;
}
