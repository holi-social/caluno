import { Field, ID, InputType, Int } from '@nestjs/graphql';
import { SigneeType } from '../enums';

@InputType()
export class CreateTemplateSigneeInput {
  @Field(() => Int)
  order!: number;

  @Field(() => SigneeType)
  signeeType!: SigneeType;

  @Field(() => ID, { nullable: true })
  requiredPermissionId?: string | null;
}
