import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Document {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  storageKey: string;

  @Field(() => String)
  mimeType: string;

  @Field(() => Date)
  uploadedAt: Date;
}
