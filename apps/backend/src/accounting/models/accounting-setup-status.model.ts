import { Field, ID, ObjectType } from '@nestjs/graphql';
import { ReimbursementTypeKey } from '../enums';

@ObjectType()
export class AccountingTemplateSlotStatus {
  @Field(() => ID)
  reimbursementTypeId!: string;

  @Field(() => ReimbursementTypeKey)
  reimbursementTypeKey!: ReimbursementTypeKey;

  @Field(() => Boolean)
  hasContractTemplate!: boolean;

  @Field(() => Boolean)
  hasInvoiceTemplate!: boolean;

  @Field(() => Boolean)
  ready!: boolean;
}

@ObjectType()
export class AccountingSetupStatus {
  @Field(() => Boolean)
  orgProfileComplete!: boolean;

  @Field(() => [String])
  missingOrgProfileFields!: string[];

  @Field(() => [AccountingTemplateSlotStatus])
  slots!: AccountingTemplateSlotStatus[];

  @Field(() => Boolean)
  canManageTemplates!: boolean;

  @Field(() => Boolean)
  canCreateDocuments!: boolean;
}
