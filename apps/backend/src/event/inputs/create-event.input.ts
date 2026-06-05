import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class CreateEventInput {
  @Field(() => String)
  title!: string;

  @Field(() => String, { nullable: true })
  location!: string | null;

  @Field(() => String, { nullable: true })
  logoUrl!: string | null;

  @Field(() => String, { nullable: true })
  coverUrl!: string | null;

  @Field(() => Date)
  startsAt!: Date;

  @Field(() => Date)
  endsAt!: Date;

  @Field(() => [String], { nullable: true })
  invitedMemberIds!: string[] | null;
}
