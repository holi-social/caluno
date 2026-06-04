import { Field, ObjectType } from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-scalars';
import type { OrganizationNode } from '../types/organization-node';

@ObjectType()
export class OrganizationTree {
  @Field(() => GraphQLJSON)
  root!: OrganizationNode;
}
