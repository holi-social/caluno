import { Field, ID, ObjectType } from '@nestjs/graphql';
import { createPaginatedResponseType } from '../../graphql/paginated-response.model';

/**
 * Preloaded shape of a time entry returned by `findMyEntries`
 * (time entry → shift instance → master shift → org unit → organization).
 */
export type MyTimeEntryEntity = {
  id: string;
  startedAt: Date;
  endedAt: Date | null;
  shiftInstance: {
    overrideTitle: string | null;
    master: {
      title: string;
      organizationUnit: {
        name: string;
        organization: { name: string };
      } | null;
    } | null;
  } | null;
};

/**
 * Read model for the volunteering "My Time" view — flat on purpose so the
 * cross-org view never touches the org-scoped `TimeEntry` field resolvers.
 */
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

export const mapToMyTimeEntry = (entry: MyTimeEntryEntity): MyTimeEntry => {
  const model = new MyTimeEntry();
  model.id = entry.id;
  model.startedAt = entry.startedAt;
  model.endedAt = entry.endedAt;
  model.shiftName =
    entry.shiftInstance?.overrideTitle ??
    entry.shiftInstance?.master?.title ??
    '';
  model.organizationName =
    entry.shiftInstance?.master?.organizationUnit?.organization?.name ?? '';
  model.organizationUnitName =
    entry.shiftInstance?.master?.organizationUnit?.name ?? '';
  return model;
};

export const MyTimeEntryPaginatedResponse =
  createPaginatedResponseType<MyTimeEntry>(MyTimeEntry, 'MyTimeEntry');

export type MyTimeEntryPaginatedResponse = InstanceType<
  typeof MyTimeEntryPaginatedResponse
>;
