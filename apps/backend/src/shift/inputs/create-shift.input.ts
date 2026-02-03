import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class CreateShiftInput {
  @Field(() => String)
  description: string;

  @Field(() => String, { nullable: true })
  projectId: string | null;

  @Field(() => Date)
  startsAt: Date;

  @Field(() => Date)
  endsAt: Date;

  @Field(() => String, { nullable: true })
  location: string | null;
}
