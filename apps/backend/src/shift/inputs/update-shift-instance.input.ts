import { Field, Int, InputType } from '@nestjs/graphql';
import { ShiftVisibility } from '../enums';

@InputType()
export class UpdateShiftInstanceInput {
  @Field(() => String)
  title!: string;

  @Field(() => Date)
  startsAt!: Date;

  @Field(() => Date)
  endsAt!: Date;

  @Field(() => String, { nullable: true })
  location?: string | null;

  @Field(() => String, { nullable: true })
  instructions?: string | null;

  @Field(() => Int, { nullable: true })
  minVolunteers?: number | null;

  @Field(() => Int, { nullable: true })
  maxVolunteers?: number | null;

  @Field(() => String, { nullable: true })
  rrule?: string | null;

  @Field(() => ShiftVisibility, { nullable: true })
  visibility?: ShiftVisibility;

  @Field(() => String, { nullable: true })
  imageFileId?: string | null;

  @Field(() => [String], { nullable: true })
  requiredFormIds?: string[] | null;
}
