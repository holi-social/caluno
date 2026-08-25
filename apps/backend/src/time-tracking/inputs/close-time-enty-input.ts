import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class CloseTimeEntryInput {
  @Field(() => Date)
  endedAt!: Date;

  @Field(() => String, { nullable: true })
  notes?: string | null;
}
