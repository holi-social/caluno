import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { Task } from '../../task/models/task.model';
import { User } from '../../user/models/user.model';
import { TimeRecord } from './time-record.model';

export enum TimeSessionStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

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

  @Field(() => User)
  validatedBy: User;

  @Field(() => Date)
  validatedAt: Date;

  @Field(() => String, { nullable: true })
  rejectionReason: string | null;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date, { nullable: true })
  updatedAt: Date;
}
