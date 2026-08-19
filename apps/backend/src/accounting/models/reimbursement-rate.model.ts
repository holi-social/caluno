import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { Organization } from '../../organization/models/organization.model';
import { ReimbursementType } from './reimbursement-type.model';

@ObjectType()
export class ReimbursementRate {
  @Field(() => ID)
  id!: string;

  @Field(() => Organization)
  organization!: Organization;

  @Field(() => ReimbursementType)
  reimbursementType!: ReimbursementType;

  @Field(() => Int)
  hourlyRateCents!: number;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date, { nullable: true })
  updatedAt?: Date | null;
}
