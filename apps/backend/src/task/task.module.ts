import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { UserModule } from '../user/user.module';
import { TaskMapper } from './mappers/task.mapper';
import { TaskFieldResolver } from './resolvers/task-field.resolver';
import { TaskMutationResolver } from './resolvers/task-mutation.resolver';
import { TaskQueryResolver } from './resolvers/task-query.resolver';
import { TaskService } from './task.service';

@Module({
  imports: [DatabaseModule, UserModule],
  providers: [
    TaskService,
    TaskMapper,
    TaskQueryResolver,
    TaskMutationResolver,
    TaskFieldResolver,
  ],
  exports: [TaskService],
})
export class TaskModule {}
