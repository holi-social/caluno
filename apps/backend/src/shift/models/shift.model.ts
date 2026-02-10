import { Field, ID, ObjectType } from '@nestjs/graphql';
import { createPaginatedResponseType } from '../../graphql/paginated-response.model';
import { Organization } from '../../organization/models/organization.model';
import { Project } from '../../project/models/project.model';
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

  @Field(() => Project, { nullable: true })
  project: Project | null;

  @Field(() => Date)
  startsAt: Date;

  @Field(() => Date)
  endsAt: Date;

  @Field(() => User)
  createdBy: User;

  @Field(() => String, { nullable: true })
  location: string | null;

  @Field(() => [User], { nullable: true })
  volunteers: User[];

  @Field(() => ShiftVisibility)
  visibility: ShiftVisibility;
}

export const ShiftPaginatedResponse = createPaginatedResponseType<Shift>(
  Shift,
  'Shift',
);

export type ShiftPaginatedResponse = InstanceType<
  typeof ShiftPaginatedResponse
>;
