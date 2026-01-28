import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { createPaginatedResponseType } from '../../graphql/paginated-response.model';
import { Organization } from '../../organization/models/organization.model';
import { Task } from '../../task/models/task.model';
import { User } from '../../user/models/user.model';
import { ProjectStatus } from '../enums';

registerEnumType(ProjectStatus, {
  name: 'ProjectStatus',
});

@ObjectType()
export class Project {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  title: string;

  @Field(() => String)
  slug: string;

  @Field(() => String)
  description: string;

  @Field(() => String)
  location: string;

  @Field(() => Organization)
  organization: Organization;

  @Field(() => Date)
  startsAt: Date;

  @Field(() => Date)
  endsAt: Date;

  @Field(() => ProjectStatus)
  status: ProjectStatus;

  @Field(() => [Task], { nullable: true })
  tasks: Task[];

  @Field(() => User)
  createdBy: User;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date, { nullable: true })
  updatedAt: Date;
}

export const ProjectPaginatedResponse = createPaginatedResponseType<Project>(
  Project,
  'Project',
);

export type ProjectPaginatedResponse = InstanceType<
  typeof ProjectPaginatedResponse
>;
