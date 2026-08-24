import { Field, ID, InputType } from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-scalars';
import { DocumentKind, RenewalCadence } from '../enums';
import { CreateTemplateSigneeInput } from './create-template-signee.input';

@InputType()
export class CreateDocumentTemplateInput {
  // Omit for the organization-wide default template; set to an organization
  // unit ID to create an override for that unit only.
  @Field(() => ID, { nullable: true })
  organizationUnitId?: string | null;

  @Field(() => ID)
  reimbursementTypeId!: string;

  @Field(() => DocumentKind)
  kind!: DocumentKind;

  @Field(() => RenewalCadence, { nullable: true })
  renewalCadence?: RenewalCadence | null;

  @Field(() => String, { nullable: true })
  invoiceNumberFormat?: string | null;

  @Field(() => GraphQLJSON)
  body!: unknown;

  @Field(() => [CreateTemplateSigneeInput])
  signees!: CreateTemplateSigneeInput[];
}
