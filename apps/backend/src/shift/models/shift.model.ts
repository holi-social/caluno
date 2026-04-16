import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { createPaginatedResponseType } from '../../graphql/paginated-response.model';
import { Organization } from '../../organization/models/organization.model';
import { User } from '../../user/models/user.model';
import { ShiftVisibility } from '../enums';

@ObjectType()
export class Shift {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  title: string;

  @Field(() => String)
  slug: string;

  @Field(() => String, { nullable: true })
  instructions: string | null;

  @Field(() => Organization)
  organization: Organization;

  @Field(() => User)
  createdBy: User;

  @Field(() => String, { nullable: true })
  location: string | null;

  @Field(() => ShiftVisibility)
  visibility: ShiftVisibility;

  @Field(() => Int, { nullable: true })
  maxVolunteers: number | null;

  @Field(() => String, { nullable: true })
  rrule: string | null;

  @Field(() => Date)
  originalStartsAt: Date;

  @Field(() => Int)
  durationMinutes: number;

  @Field(() => Boolean)
  isDeleted: boolean;

  @Field(() => Date)
  createdAt: Date;
}

export const ShiftPaginatedResponse = createPaginatedResponseType<Shift>(
  Shift,
  'Shift',
);

export type ShiftPaginatedResponse = InstanceType<
  typeof ShiftPaginatedResponse
>;
