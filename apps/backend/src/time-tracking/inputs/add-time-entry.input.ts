import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class AddTimeEntryInput {
  @Field(() => String, { nullable: true })
  shiftInstanceId?: string | null;

  @Field(() => String)
  volunteerId!: string;

  @Field(() => Date)
  startedAt!: Date;

  @Field(() => Date, { nullable: true })
  endedAt?: Date | null;

  @Field(() => String, { nullable: true })
  notes?: string | null;
}
