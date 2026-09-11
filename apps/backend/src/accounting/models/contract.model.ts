import { Field, ID, ObjectType } from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-scalars';
import { User } from '../../user/models/user.model';
import { ContractStatus, SigneeType } from '../enums';
import { ContractSignature } from './contract-signature.model';
import { ContractStatusChange } from './contract-status-change.model';
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

  @Field(() => String, { nullable: true })
  downloadUrl?: string | null;

  @Field(() => [ContractSignature])
  signatures!: ContractSignature[];

  @Field(() => [ContractStatusChange])
  statusChanges!: ContractStatusChange[];

  /**
   * The profile-required data sources this document's template reads that the
   * volunteer has not yet supplied. Empty once the document is ready to be
   * signed (the sign gate blocks the volunteer otherwise).
   */
  @Field(() => [String])
  missingProfileFields!: string[];

  /**
   * The org-profile sources (e.g. org_city/org_address) this document's
   * template needs that the organization has not yet supplied. Empty once the
   * org profile is complete enough to create the document.
   */
  @Field(() => [String])
  missingOrgProfileFields!: string[];

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date, { nullable: true })
  updatedAt?: Date | null;
}
