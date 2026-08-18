import { Field, ID, ObjectType } from '@nestjs/graphql';
import { User } from '../../user/models/user.model';
import { DocumentEventType } from '../enums';

@ObjectType()
export class DocumentEvent {
  @Field(() => ID)
  id!: string;

  @Field(() => DocumentEventType)
  type!: DocumentEventType;

  @Field(() => User, { nullable: true })
  actorUser?: User | null;

  @Field(() => Date)
  occurredAt!: Date;
}
