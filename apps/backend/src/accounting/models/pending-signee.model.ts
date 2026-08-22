import { Field, ObjectType } from '@nestjs/graphql';
import { SigneeType } from '../enums';

@ObjectType()
export class PendingSignee {
  @Field(() => SigneeType)
  signeeType!: SigneeType;

  @Field(() => String, { nullable: true })
  userId?: string | null;

  @Field(() => String, { nullable: true })
  permissionKey?: string | null;

  @Field(() => [String], { nullable: true })
  eligibleUserIds?: string[] | null;
}
