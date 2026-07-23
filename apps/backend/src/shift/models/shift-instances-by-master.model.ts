import { Field, ID, ObjectType } from '@nestjs/graphql';
import { ShiftInstance } from './shift-instance.model';

@ObjectType()
export class ShiftInstancesByMaster {
  @Field(() => ID)
  masterId!: string;

  @Field(() => [ShiftInstance])
  instances!: ShiftInstance[];
}
