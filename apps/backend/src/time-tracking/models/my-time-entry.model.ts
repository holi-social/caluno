import { Field, ID, ObjectType } from '@nestjs/graphql';
import { createPaginatedResponseType } from '../../graphql/paginated-response.model';

@ObjectType()
export class MyTimeEntry {
  @Field(() => ID)
  id!: string;

  @Field(() => Date)
  startedAt!: Date;

  @Field(() => Date, { nullable: true })
  endedAt!: Date | null;

  @Field(() => String)
  shiftName!: string;

  @Field(() => String)
  organizationName!: string;

  @Field(() => String)
  organizationUnitName!: string;
}

export const MyTimeEntryPaginatedResponse =
  createPaginatedResponseType<MyTimeEntry>(MyTimeEntry, 'MyTimeEntry');

export type MyTimeEntryPaginatedResponse = InstanceType<
  typeof MyTimeEntryPaginatedResponse
>;
