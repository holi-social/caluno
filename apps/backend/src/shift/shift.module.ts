import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { ShiftMapper } from './mappers/shift.mapper';
import { ShiftMutationResolver } from './resolvers/shift-mutation.resolver';
import { ShiftQueryResolver } from './resolvers/shift-query.resolver';
import { ShiftService } from './shift.service';

@Module({
  imports: [DatabaseModule],
  providers: [
    ShiftService,
    ShiftQueryResolver,
    ShiftMapper,
    ShiftMutationResolver,
  ],
})
export class ShiftModule {}
