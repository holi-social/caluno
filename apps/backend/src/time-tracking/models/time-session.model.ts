import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { Task } from '../../task/models/task.model';
import { User } from '../../user/models/user.model';
import { TimeSessionStatus } from '../enums';
import { TimeRecord } from './time-record.model';

registerEnumType(TimeSessionStatus, {
  name: 'TimeSessionStatus',
});

@ObjectType()
export class TimeSession {
  @Field(() => ID)
  id: string;

  @Field(() => User)
  user: User;

  @Field(() => Task)
  task: Task;

  @Field(() => TimeSessionStatus)
  status: TimeSessionStatus;

  @Field(() => [TimeRecord])
  records: TimeRecord[];

  @Field(() => User, { nullable: true })
  validatedBy: User | null;

  @Field(() => Date, { nullable: true })
  validatedAt: Date | null;

  @Field(() => String, { nullable: true })
  rejectionReason: string | null;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date, { nullable: true })
  updatedAt: Date;
}
