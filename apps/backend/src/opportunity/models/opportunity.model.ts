import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { createPaginatedResponseType } from '../../graphql/paginated-response.model';
import { Organization } from '../../organization/models/organization.model';
import { Task } from '../../task/models/task.model';
import { User } from '../../user/models/user.model';

export enum OpportunityStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  ARCHIVED = 'ARCHIVED',
}

registerEnumType(OpportunityStatus, {
  name: 'OpportunityStatus',
});

@ObjectType()
export class Opportunity {
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

  @Field(() => OpportunityStatus)
  status: OpportunityStatus;

  @Field(() => [Task], { nullable: true })
  tasks: Task[];

  @Field(() => User)
  createdBy: User;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date, { nullable: true })
  updatedAt: Date;
}

export const OpportunityPaginatedResponse =
  createPaginatedResponseType<Opportunity>(Opportunity, 'Opportunity');

export type OpportunityPaginatedResponse = InstanceType<
  typeof OpportunityPaginatedResponse
>;
