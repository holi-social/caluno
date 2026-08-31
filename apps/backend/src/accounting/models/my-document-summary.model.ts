import { Field, Int, ObjectType } from '@nestjs/graphql';

/**
 * Counts for the "My documents" entry in the profile dropdown: whether the
 * volunteer has any documents at all (the entry only shows when total > 0)
 * and how many currently need their signature (the badge).
 */
@ObjectType()
export class MyDocumentSummary {
  @Field(() => Int)
  total!: number;

  @Field(() => Int)
  pending!: number;
}
