import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class UpdateMyImageInput {
  @Field(() => String, { nullable: true })
  imageFileId?: string | null;
}
