import { Field, ID, ObjectType } from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-scalars';
import { User } from '../../user/models/user.model';
import { ContractStatus, SigneeType } from '../enums';
import { ContractEvent } from './contract-event.model';
import { ContractSignature } from './contract-signature.model';
import { DocumentTemplate } from './document-template.model';
import { ReimbursementType } from './reimbursement-type.model';

@ObjectType()
export class Contract {
  @Field(() => ID)
  id!: string;

  @Field(() => DocumentTemplate)
  documentTemplate!: DocumentTemplate;

  @Field(() => User)
  volunteer!: User;

  @Field(() => ReimbursementType)
  reimbursementType!: ReimbursementType;

  @Field(() => ContractStatus)
  contractStatus!: ContractStatus;

  @Field(() => Date)
  periodStart!: Date;

  @Field(() => Date)
  periodEnd!: Date;

  @Field(() => Date, { nullable: true })
  renewDate?: Date | null;

  @Field(() => Boolean)
  isNonCompliant!: boolean;

  @Field(() => GraphQLJSON)
  resolvedBody!: unknown;

  @Field(() => String, { nullable: true })
  declineReason?: string | null;

  @Field(() => User, { nullable: true })
  declinedByUser?: User | null;

  @Field(() => Date, { nullable: true })
  declinedAt?: Date | null;

  @Field(() => SigneeType, { nullable: true })
  declinedAtSigneeType?: SigneeType | null;

  @Field(() => [ContractSignature])
  signatures!: ContractSignature[];

  @Field(() => [ContractEvent])
  events!: ContractEvent[];

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date, { nullable: true })
  updatedAt?: Date | null;
}
