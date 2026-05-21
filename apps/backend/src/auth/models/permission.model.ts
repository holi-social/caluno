import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { PermissionKey } from '../enums';

registerEnumType(PermissionKey, {
  name: 'PermissionKey',
});

@ObjectType()
export class Permission {
  @Field(() => ID)
  id!: string;

  @Field(() => PermissionKey)
  key!: PermissionKey;

  @Field(() => String, { nullable: true })
  description!: string | null;
}
