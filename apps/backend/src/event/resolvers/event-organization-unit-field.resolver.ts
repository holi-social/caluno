import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import {
  AllowAnonymous,
  Session,
  type UserSession,
} from '@thallesp/nestjs-better-auth';
import { plainToInstance } from 'class-transformer';
import { MembershipService } from '../../membership/membership.service';
import { RequiredFormRef } from '../../organization/models/organization-unit-required-form.model';
import { RequiredFormTargetType } from '../../requirement-profile/enums';
import { RequirementForm } from '../../requirement-profile/models/requirement-form.model';
import { RequiredFormService } from '../../requirement-profile/services/required-form.service';
import { JoinStatus } from '../../shared/enums/join-status.enum';
import { EventOrganizationUnit } from '../models/event-organization-unit.model';

@Resolver(() => EventOrganizationUnit)
export class EventOrganizationUnitFieldResolver {
  constructor(
    private readonly requiredFormService: RequiredFormService,
    private readonly membershipService: MembershipService,
  ) {}

  @AllowAnonymous()
  @ResolveField(() => [RequiredFormRef])
  async requiredForms(
    @Parent() organizationUnit: EventOrganizationUnit,
  ): Promise<RequiredFormRef[]> {
    const requiredForms = await this.requiredFormService.getRequiredForms({
      targetType: RequiredFormTargetType.ORGANIZATION_UNIT,
      targetId: organizationUnit.id,
    });

    return requiredForms.map(({ form, order }) => ({
      form: plainToInstance(RequirementForm, form),
      order,
    }));
  }

  @AllowAnonymous()
  @ResolveField(() => JoinStatus)
  async myMembershipState(
    @Parent() organizationUnit: EventOrganizationUnit,
    @Session() session: UserSession,
  ): Promise<JoinStatus> {
    if (!session?.user) {
      return JoinStatus.NONE;
    }
    return this.membershipService.getMembershipState(
      session.user.id,
      organizationUnit.id,
    );
  }
}
