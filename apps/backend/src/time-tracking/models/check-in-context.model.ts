import { Field, ObjectType } from '@nestjs/graphql';
import { OrganizationUnit } from '../../organization/models/organization-unit.model';
import { User } from '../../user/models/user.model';
import { TimeEntry } from './time-entry.model';

@ObjectType()
export class CheckInContext {
  @Field(() => User)
  volunteer!: User;

  @Field(() => [OrganizationUnit])
  eligibleOrganizationUnits!: OrganizationUnit[];

  @Field(() => [TimeEntry])
  openTimeEntries!: TimeEntry[];
}
