import { Field, ID, ObjectType } from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-scalars';
import { Organization } from '../../organization/models/organization.model';
import { OrganizationUnit } from '../../organization/models/organization-unit.model';
import { User } from '../../user/models/user.model';
import { DocumentKind, RenewalCadence } from '../enums';
import { ReimbursementType } from './reimbursement-type.model';
import { TemplateSignee } from './template-signee.model';

@ObjectType()
export class DocumentTemplate {
  @Field(() => ID)
  id!: string;

  @Field(() => Organization)
  organization!: Organization;

  // Null means this is the organization-wide default template; set means
  // it's an override scoped to just this unit.
  @Field(() => OrganizationUnit, { nullable: true })
  organizationUnit?: OrganizationUnit | null;

  @Field(() => ReimbursementType)
  reimbursementType!: ReimbursementType;

  @Field(() => DocumentKind)
  kind!: DocumentKind;

  @Field(() => RenewalCadence, { nullable: true })
  renewalCadence?: RenewalCadence | null;

  @Field(() => String, { nullable: true })
  invoiceNumberFormat?: string | null;

  @Field(() => GraphQLJSON)
  body!: unknown;

  @Field(() => Date, { nullable: true })
  lastEditedAt?: Date | null;

  @Field(() => User, { nullable: true })
  lastEditedByUser?: User | null;

  @Field(() => Boolean)
  isDeleted!: boolean;

  @Field(() => [TemplateSignee])
  signees!: TemplateSignee[];

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date, { nullable: true })
  updatedAt?: Date | null;
}
