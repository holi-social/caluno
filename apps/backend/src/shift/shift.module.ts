import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { ShiftMapper } from './mappers/shift.mapper';
import { ShiftMutationResolver } from './resolvers/shift-mutation.resolver';
import { ShiftQueryResolver } from './resolvers/shift-query.resolver';
import { ShiftService } from './shift.service';
import { ShiftFieldResolver } from './resolvers/shift-field.resolver';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [DatabaseModule, UserModule],
  providers: [
    ShiftService,
    ShiftQueryResolver,
    ShiftMapper,
    ShiftMutationResolver,
    ShiftFieldResolver,
  ],
})
export class ShiftModule {}
