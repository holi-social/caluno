import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { UserMapper } from './mappers/user.mapper';
import { UserResolver } from './user.resolver';
import { UserService } from './user.service';

@Module({
    imports: [DatabaseModule],
    providers: [UserService, UserResolver, UserMapper],
    exports: [UserService, UserMapper],
})
export class UserModule {}
