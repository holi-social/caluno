import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class UpdateMyAccountSettingsInput {
  @Field(() => String, { nullable: true })
  locale?: string | null;

  @Field(() => Boolean, { nullable: true })
  emailWeeklyUpdateEnabled?: boolean | null;

  @Field(() => Boolean, { nullable: true })
  emailUrgentCallsEnabled?: boolean | null;

  @Field(() => Boolean, { nullable: true })
  emailPlatformEnabled?: boolean | null;
}
