import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Organization } from '../../organization/models/organization.model';
import { Project } from '../../project/models/project.model';
import { User } from '../../user/models/user.model';
import { createPaginatedResponseType } from '../../graphql/paginated-response.model';

@ObjectType()
export class Shift {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  description: string;

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
  assignees: User[];
}

export const ShiftPaginatedResponse = createPaginatedResponseType<Shift>(
  Shift,
  'Shift',
);

export type ShiftPaginatedResponse = InstanceType<
  typeof ShiftPaginatedResponse
>;
