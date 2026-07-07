import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class UpdateShiftInstanceInput {
  @Field(() => String)
  title!: string;

  @Field(() => Date)
  startsAt!: Date;

  @Field(() => Date)
  endsAt!: Date;

  @Field(() => String, { nullable: true })
  location!: string | null;

  @Field(() => String, { nullable: true })
  instructions!: string | null;
}
