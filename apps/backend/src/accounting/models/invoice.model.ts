import { Field, Float, ID, Int, ObjectType } from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-scalars';
import { User } from '../../user/models/user.model';
import { InvoiceStatus, SigneeType } from '../enums';
import { DocumentTemplate } from './document-template.model';
import { InvoiceSignature } from './invoice-signature.model';
import { InvoiceStatusChange } from './invoice-status-change.model';
import { InvoiceTimeEntry } from './invoice-time-entry.model';
import { ReimbursementType } from './reimbursement-type.model';

@ObjectType()
export class Invoice {
  @Field(() => ID)
  id!: string;

  @Field(() => DocumentTemplate)
  documentTemplate!: DocumentTemplate;

  @Field(() => User)
  volunteer!: User;

  @Field(() => ReimbursementType)
  reimbursementType!: ReimbursementType;

  @Field(() => InvoiceStatus)
  invoiceStatus!: InvoiceStatus;

  @Field(() => Date)
  periodStart!: Date;

  @Field(() => Date)
  periodEnd!: Date;

  @Field(() => Int)
  totalAmountCents!: number;

  @Field(() => Float)
  totalHours!: number;

  @Field(() => Boolean)
  isNonCompliant!: boolean;

  @Field(() => GraphQLJSON)
  resolvedBody!: unknown;

  @Field(() => String, { nullable: true })
  declineReason?: string | null;

  @Field(() => User, { nullable: true })
  declinedByUser?: User | null;

  @Field(() => Date, { nullable: true })
  paidAt?: Date | null;

  @Field(() => User, { nullable: true })
  paidByUser?: User | null;

  @Field(() => Date, { nullable: true })
  declinedAt?: Date | null;

  @Field(() => SigneeType, { nullable: true })
  declinedAtSigneeType?: SigneeType | null;

  @Field(() => String, { nullable: true })
  downloadUrl?: string | null;

  @Field(() => [InvoiceSignature])
  signatures!: InvoiceSignature[];

  @Field(() => [InvoiceStatusChange])
  statusChanges!: InvoiceStatusChange[];

  @Field(() => [InvoiceTimeEntry])
  invoiceTimeEntries!: InvoiceTimeEntry[];

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date, { nullable: true })
  updatedAt?: Date | null;
}
