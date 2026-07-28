import { Int, Parent, ResolveField, Resolver } from '@nestjs/graphql';
import {
  AllowAnonymous,
  Session,
  type UserSession,
} from '@thallesp/nestjs-better-auth';
import { plainToInstance } from 'class-transformer';
import { Loader } from '../../graphql/decorators/loader.decorator';
import { RequiredFormRef } from '../../organization/models/organization-unit-required-form.model';
import { RequiredFormTargetType } from '../../requirement-profile/enums';
import { RequirementForm } from '../../requirement-profile/models/requirement-form.model';
import { RequiredFormService } from '../../requirement-profile/services/required-form.service';
import { Shift } from '../../shift/models/shift.model';
import { UserMapper } from '../../user/mappers/user.mapper';
import { User } from '../../user/models/user.model';
import { UserService } from '../../user/user.service';
import { EventInviteStatus } from '../enums';
import { EventService } from '../event.service';
import { Event } from '../models/event.model';
import { EventOrganizationUnit } from '../models/event-organization-unit.model';
import type { EventEntity } from '../schemas/event.schema';
import { EventOrganizationUnitLoader } from './event-organization-unit.loader';
import { EventRequiredFormsLoader } from './event-required-forms.loader';
import { EventShiftsLoader } from './loader';

@Resolver(() => Event)
export class EventFieldResolver {
  constructor(
    private readonly userService: UserService,
    private readonly userMapper: UserMapper,
    private readonly eventService: EventService,
    private readonly requiredFormService: RequiredFormService,
  ) {}

  @AllowAnonymous()
  @ResolveField(() => User, { nullable: true })
  async organizer(
    @Parent() event: EventEntity,
    @Session() session: UserSession,
  ): Promise<User | null> {
    if (!session?.user) {
      return null;
    }

    const organizer = await this.userService.findByIdOrThrow(event.createdById);
    return this.userMapper.toModelOrThrow(organizer);
  }

  @AllowAnonymous()
  @ResolveField(() => Int)
  async shiftsCount(
    @Parent() event: EventEntity,
    @Loader(EventShiftsLoader) loader: EventShiftsLoader,
  ): Promise<number> {
    return loader.countByEventId.load(event.id);
  }

  @AllowAnonymous()
  @ResolveField(() => Int)
  async requiredFormsCount(
    @Parent() event: EventEntity,
    @Loader(EventRequiredFormsLoader) loader: EventRequiredFormsLoader,
  ): Promise<number> {
    return loader.countByEventId.load(event.id);
  }

  // Events are a lower-commitment "following" shortlist, not an invite flow —
  // deliberately a boolean, kept separate from shift invite vocabulary. Org
  // membership pending/rejected is surfaced elsewhere (OrganizationUnit).
  @AllowAnonymous()
  @ResolveField(() => Boolean)
  async isFollowing(
    @Parent() event: EventEntity,
    @Session() session: UserSession,
  ): Promise<boolean> {
    if (!session?.user) return false;

    const invite = await this.eventService.findInvite(
      event.id,
      session.user.id,
    );
    return invite?.status === EventInviteStatus.ACCEPTED;
  }

  @AllowAnonymous()
  @ResolveField(() => [Shift])
  async shifts(
    @Parent() event: EventEntity,
    @Loader(EventShiftsLoader) loader: EventShiftsLoader,
  ): Promise<Shift[]> {
    return loader.shiftsByEventId.load(event.id);
  }

  @AllowAnonymous()
  @ResolveField(() => String, { nullable: true })
  coverImageUrl(@Parent() event: EventEntity): string | null {
    return event.coverUrl ?? null;
  }

  @AllowAnonymous()
  @ResolveField(() => EventOrganizationUnit, { nullable: true })
  async organizationUnit(
    @Parent() event: EventEntity,
    @Loader(EventOrganizationUnitLoader) loader: EventOrganizationUnitLoader,
  ): Promise<EventOrganizationUnit | null> {
    return loader.organizationUnitById.load(event.organizationUnitId);
  }

  @AllowAnonymous()
  @ResolveField(() => [RequiredFormRef])
  async requiredForms(
    @Parent() event: EventEntity,
  ): Promise<RequiredFormRef[]> {
    const requiredForms = await this.requiredFormService.getRequiredForms({
      targetType: RequiredFormTargetType.EVENT,
      targetId: event.id,
    });

    return requiredForms.map(({ form, order }) => ({
      form: plainToInstance(RequirementForm, form),
      order,
    }));
  }
}
