import { Args, ID, Query, Resolver } from '@nestjs/graphql';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { OrganizationRole } from '../../organization/enums';
import { User } from '../../user/models/user.model';
import { MembershipService } from '../membership.service';
import { Membership } from '../models/membership.model';

@Resolver(() => Membership)
export class MembershipQueryResolver {
  constructor(private readonly membershipService: MembershipService) {}

  @Query(() => Membership)
  async membership(
    @Args('organizationId', { type: () => ID }) organizationId: string,
    @Session() session: UserSession,
  ): Promise<Membership | null> {
    return this.membershipService.getMembership(
      session.user.id,
      organizationId,
    );
  }

  @Query(() => User)
  async usersByRole(
    @Args('organizationId', { type: () => ID }) organizationId: string,
    @Args('role', { type: () => OrganizationRole }) role: OrganizationRole,
  ): Promise<User[]> {
    return this.membershipService.findUsersByRole(organizationId, role);
  }

  @Query(() => Boolean)
  async isUserOrganizationAdmin(
    @Args('organizationId', { type: () => ID }) organizationId: string,
    @Session() session: UserSession,
  ): Promise<boolean> {
    return this.membershipService.isAdmin(session.user.id, organizationId);
  }

  @Query(() => Boolean)
  async isUserOrganizationVolunteer(
    @Args('organizationId', { type: () => ID }) organizationId: string,
    @Session() session: UserSession,
  ): Promise<boolean> {
    return this.membershipService.isVolunteer(session.user.id, organizationId);
  }

  @Query(() => Boolean)
  async isUserOrganizationStaff(
    @Args('organizationId', { type: () => ID }) organizationId: string,
    @Session() session: UserSession,
  ): Promise<boolean> {
    return this.membershipService.isStaff(session.user.id, organizationId);
  }

  @Query(() => Boolean)
  async isUserOrganizationMember(
    @Args('organizationId', { type: () => ID }) organizationId: string,
    @Session() session: UserSession,
  ): Promise<boolean> {
    return this.membershipService.isMember(session.user.id, organizationId);
  }
}
