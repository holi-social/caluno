import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { Permission } from '../../auth/models/permission.model';
import { SigneeType } from '../enums';

@ObjectType()
export class TemplateSignee {
  @Field(() => ID)
  id!: string;

  @Field(() => Int)
  order!: number;

  @Field(() => SigneeType)
  signeeType!: SigneeType;

  @Field(() => Permission, { nullable: true })
  requiredPermission?: Permission | null;
}
