import { Field, InputType } from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-scalars';
import { RenewalCadence } from '../enums';
import { CreateTemplateSigneeInput } from './create-template-signee.input';

@InputType()
export class UpdateDocumentTemplateInput {
  @Field(() => RenewalCadence, { nullable: true })
  renewalCadence?: RenewalCadence | null;

  @Field(() => String, { nullable: true })
  invoiceNumberFormat?: string | null;

  @Field(() => GraphQLJSON, { nullable: true })
  body?: unknown;

  @Field(() => [CreateTemplateSigneeInput], { nullable: true })
  signees?: CreateTemplateSigneeInput[];
}
