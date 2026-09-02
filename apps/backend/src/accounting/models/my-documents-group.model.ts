import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Contract } from './contract.model';
import { Invoice } from './invoice.model';

/**
 * One organization's worth of the volunteer's documents, as seen on the
 * cross-org "My documents" page. Grouped by organization (not by membership)
 * because documents are org-scoped — two memberships in the same org would
 * otherwise show the same documents twice.
 */
@ObjectType()
export class MyDocumentsGroup {
  /** One of the volunteer's memberships in this org — used to route previews. */
  @Field(() => ID)
  membershipId!: string;

  @Field(() => ID)
  organizationUnitId!: string;

  @Field(() => String)
  organizationUnitName!: string;

  @Field(() => String)
  organizationName!: string;

  @Field(() => String, { nullable: true })
  logoUrl?: string | null;

  @Field(() => [Contract])
  contracts!: Contract[];

  @Field(() => [Invoice])
  invoices!: Invoice[];
}
