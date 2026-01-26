import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class CreateTaskAssignmentInput {
  @Field(() => String)
  taskId: string;

  @Field(() => String)
  assigneeId: string;

  @Field(() => String)
  organizationId: string;
}
