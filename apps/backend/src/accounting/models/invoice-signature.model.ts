import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { Permission } from '../../auth/models/permission.model';
import { User } from '../../user/models/user.model';
import { SigneeType } from '../enums';

@ObjectType()
export class InvoiceSignature {
  @Field(() => ID)
  id!: string;

  @Field(() => Int)
  order!: number;

  @Field(() => SigneeType)
  signeeType!: SigneeType;

  @Field(() => Permission, { nullable: true })
  requiredPermission?: Permission | null;

  @Field(() => User, { nullable: true })
  signedByUser?: User | null;

  @Field(() => Date, { nullable: true })
  signedAt?: Date | null;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date, { nullable: true })
  updatedAt?: Date | null;
}
