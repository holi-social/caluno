import { Field, Int, ObjectType } from '@nestjs/graphql';
import { RateProvenanceKind } from '../enums';

@ObjectType()
export class RateProvenance {
  @Field(() => RateProvenanceKind)
  kind!: RateProvenanceKind;

  /**
   * INHERITED: the unit or organisation that set the rate in force. OWN: the
   * one that set the rate this unit replaces, null when that is the platform
   * default.
   */
  @Field(() => String, { nullable: true })
  sourceName?: string | null;

  /** OWN only: the rate the unit would fall back to without its own. */
  @Field(() => Int, { nullable: true })
  replacesRateCents?: number | null;
}
