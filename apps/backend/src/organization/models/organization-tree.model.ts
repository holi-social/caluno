import { Field, ID, ObjectType } from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-scalars';
import type { OrganizationNode } from '../types/organization-node';

@ObjectType()
export class OrganizationTree {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  name!: string;

  @Field(() => GraphQLJSON)
  nodes!: OrganizationNode[];
}
