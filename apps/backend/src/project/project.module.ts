import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { MembershipModule } from '../membership/membership.module';
import { TaskModule } from '../task/task.module';
import { UserModule } from '../user/user.module';
import { ProjectMapper } from './mappers/project.mapper';
import { ProjectService } from './project.service';
import {
  ProjectFieldResolver,
  ProjectMutationResolver,
  ProjectQueryResolver,
} from './resolvers';

@Module({
  imports: [DatabaseModule, UserModule, TaskModule, MembershipModule],
  providers: [
    ProjectService,
    ProjectMapper,
    ProjectQueryResolver,
    ProjectMutationResolver,
    ProjectFieldResolver,
  ],
  exports: [ProjectService],
})
export class ProjectModule {}
