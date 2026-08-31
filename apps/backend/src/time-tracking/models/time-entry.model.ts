import { Field, ID, ObjectType } from '@nestjs/graphql';
import { ReimbursementType } from '../../accounting/models/reimbursement-type.model';
import { createPaginatedResponseType } from '../../graphql/paginated-response.model';
import { OrganizationUnit } from '../../organization/models/organization-unit.model';
import { ShiftInstance } from '../../shift/models/shift-instance.model';
import { User } from '../../user/models/user.model';

@ObjectType()
export class TimeEntry {
  @Field(() => ID)
  id!: string;

  @Field(() => Date)
  startedAt!: Date;

  @Field(() => Date, { nullable: true })
  endedAt?: Date | null;

  @Field(() => String, { nullable: true })
  notes?: string | null;

  @Field(() => ReimbursementType, { nullable: true })
  reimbursementType?: ReimbursementType | null;

  @Field(() => Boolean)
  isPaid!: boolean;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => User)
  volunteer!: User;

  @Field(() => ShiftInstance, { nullable: true })
  shiftInstance?: ShiftInstance | null;

  @Field(() => OrganizationUnit)
  organizationUnit!: OrganizationUnit;
}

export const TimeEntryPaginatedResponse =
  createPaginatedResponseType<TimeEntry>(TimeEntry, 'TimeEntry');

export type TimeEntryPaginatedResponse = InstanceType<
  typeof TimeEntryPaginatedResponse
>;
