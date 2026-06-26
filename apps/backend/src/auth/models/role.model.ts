import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Organization } from '../../organization/models/organization.model';
import { Permission } from './permission.model';

@ObjectType()
export class Role {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  name!: string;

  @Field(() => String, { nullable: true })
  description!: string | null;

  @Field(() => Boolean)
  isInternal!: boolean;

  @Field(() => [Permission])
  permissions!: Permission[];

  @Field(() => Organization)
  organization!: Organization;
}
