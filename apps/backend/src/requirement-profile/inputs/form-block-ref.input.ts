import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class FormBlockRefInput {
  @Field(() => String)
  blockId!: string;

  @Field(() => Number, { nullable: true })
  order!: number | null;

  @Field(() => Boolean, { nullable: true })
  required!: boolean | null;
}
