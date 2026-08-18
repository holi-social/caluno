import { Field, Float, ID, Int, ObjectType } from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-scalars';
import { User } from '../../user/models/user.model';
import {
  ContractStatus,
  DocumentKind,
  InvoiceStatus,
  SigneeType,
} from '../enums';
import { DocumentEvent } from './document-event.model';
import { DocumentSignature } from './document-signature.model';
import { DocumentTemplate } from './document-template.model';
import { ReimbursementType } from './reimbursement-type.model';

@ObjectType()
export class CreatedDocument {
  @Field(() => ID)
  id!: string;

  @Field(() => DocumentTemplate)
  documentTemplate!: DocumentTemplate;

  @Field(() => User)
  volunteer!: User;

  @Field(() => ReimbursementType)
  reimbursementType!: ReimbursementType;

  @Field(() => DocumentKind)
  kind!: DocumentKind;

  @Field(() => ContractStatus, { nullable: true })
  contractStatus?: ContractStatus | null;

  @Field(() => InvoiceStatus, { nullable: true })
  invoiceStatus?: InvoiceStatus | null;

  @Field(() => Date)
  periodStart!: Date;

  @Field(() => Date)
  periodEnd!: Date;

  @Field(() => Date, { nullable: true })
  renewDate?: Date | null;

  @Field(() => Int, { nullable: true })
  totalAmountCents?: number | null;

  @Field(() => Float, { nullable: true })
  totalHours?: number | null;

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

  @Field(() => [DocumentSignature])
  signatures!: DocumentSignature[];

  @Field(() => [DocumentEvent])
  events!: DocumentEvent[];

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date, { nullable: true })
  updatedAt?: Date | null;
}
