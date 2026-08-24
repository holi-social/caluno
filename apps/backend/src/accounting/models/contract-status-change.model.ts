import { Field, ID, ObjectType } from '@nestjs/graphql';
import { User } from '../../user/models/user.model';
import { DocumentStatusChange } from '../enums';

@ObjectType()
export class ContractStatusChange {
  @Field(() => ID)
  id!: string;

  @Field(() => DocumentStatusChange)
  type!: DocumentStatusChange;

  @Field(() => User, { nullable: true })
  actorUser?: User | null;

  @Field(() => Date)
  occurredAt!: Date;
}
