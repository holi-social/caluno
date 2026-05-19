import { Field, ObjectType } from '@nestjs/graphql';
import { Permission } from './permission.model';

@ObjectType()
export class PermissionGroupItem {
  @Field()
  label: string;

  @Field(() => Permission)
  permission: Permission;
}

@ObjectType()
export class PermissionGroup {
  @Field()
  key: string;

  @Field()
  label: string;

  @Field(() => [PermissionGroupItem])
  items: PermissionGroupItem[];
}
