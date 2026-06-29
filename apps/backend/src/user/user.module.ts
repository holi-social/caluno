import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { UserMapper } from './mappers/user.mapper';
import { UserFieldResolver } from './resolvers/user-field.resolver';
import { UserMutationResolver } from './resolvers/user-mutation.resolver';
import { UserQueryResolver } from './resolvers/user-query.resolver';
import { UserService } from './user.service';

@Module({
  imports: [DatabaseModule, AuthModule],
  providers: [
    UserService,
    UserQueryResolver,
    UserMutationResolver,
    UserFieldResolver,
    UserMapper,
  ],
  exports: [UserService, UserMapper],
})
export class UserModule {}
