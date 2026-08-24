import { Field, ID, InputType } from '@nestjs/graphql';
import { InvoiceStatus } from '../enums';

@InputType()
export class InvoiceFilterInput {
  @Field(() => ID, { nullable: true })
  volunteerId?: string | null;

  @Field(() => ID, { nullable: true })
  reimbursementTypeId?: string | null;

  @Field(() => InvoiceStatus, { nullable: true })
  status?: InvoiceStatus | null;
}
