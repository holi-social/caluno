import { Field, ID, ObjectType } from '@nestjs/graphql';
import { TimeEntry } from '../../time-tracking/models/time-entry.model';

@ObjectType()
export class InvoiceTimeEntry {
  @Field(() => ID)
  id!: string;

  @Field(() => TimeEntry)
  timeEntry!: TimeEntry;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date, { nullable: true })
  updatedAt?: Date | null;
}
