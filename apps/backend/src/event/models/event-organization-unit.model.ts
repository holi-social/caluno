import { Field, ID, ObjectType } from '@nestjs/graphql';
import { RequiredFormRef } from '../../organization/models/organization-unit-required-form.model';
import { JoinStatus } from '../../shared/enums/join-status.enum';

@ObjectType()
export class EventOrganizationUnit {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  name!: string;

  @Field(() => String)
  slug!: string;

  @Field(() => String, { nullable: true })
  logoUrl?: string | null;

  @Field(() => [RequiredFormRef])
  requiredForms!: RequiredFormRef[];

  @Field(() => JoinStatus)
  myMembershipState!: JoinStatus;
}
