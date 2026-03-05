import { Field, ID, InputType } from '@nestjs/graphql';
import { ProjectStatus } from '../enums';

@InputType()
export class CreateProjectInput {
  @Field(() => String)
  title: string;

  @Field(() => String)
  description: string;

  @Field(() => String)
  location: string;

  @Field(() => ID)
  organizationId: string;

  @Field(() => Date)
  startsAt: Date;

  @Field(() => Date)
  endsAt: Date;

  @Field(() => ProjectStatus, { defaultValue: ProjectStatus.DRAFT })
  status: ProjectStatus;
}
