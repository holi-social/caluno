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

  // Marks this entry as paid/reimbursable time under the given Pauschale
  // type. Left null, the entry is unpaid — the same as any entry created
  // before this field existed (see time-entry.schema.ts's default/check).
  @Field(() => String, { nullable: true })
  reimbursementTypeId?: string | null;
}
