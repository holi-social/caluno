import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Permission } from '../../auth/models/permission.model';

@ObjectType()
export class User {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  name!: string;

  @Field(() => String)
  email!: string;

  @Field(() => String, { nullable: true })
  image!: string | null;

  @Field(() => ID)
  checkInId!: string;

  @Field(() => [Permission], { nullable: true })
  permissions!: Permission[];
}
