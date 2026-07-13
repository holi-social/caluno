import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import {
  AllowAnonymous,
  Session,
  type UserSession,
} from '@thallesp/nestjs-better-auth';
import { Event } from '../../event/models/event.model';
import { Loader } from '../../graphql/decorators';
import { Organization } from '../../organization/models/organization.model';
import { OrganizationUnit } from '../../organization/models/organization-unit.model';
import { UserMapper } from '../../user/mappers/user.mapper';
import { User } from '../../user/models/user.model';
import { Shift } from '../models/shift.model';
import type { ShiftEntity } from '../schemas/shift.schema';
import { ShiftService } from '../shift.service';
import { ShiftLoader } from './shift.loader';

@Resolver(() => Shift)
export class ShiftFieldResolver {
  constructor(
    private readonly shiftService: ShiftService,
    private readonly userMapper: UserMapper,
  ) {}

  @AllowAnonymous()
  @ResolveField(() => User, { nullable: true })
  async createdBy(
    @Parent() shift: ShiftEntity,
    @Session() session: UserSession,
  ): Promise<User | null> {
    if (!session?.user) {
      return null;
    }

    const creator = await this.shiftService.findCreator(shift.createdById);
    return this.userMapper.toModelOrThrow(creator);
  }

  @AllowAnonymous()
  @ResolveField(() => Event, { nullable: true })
  async event(
    @Parent() shift: ShiftEntity,
    @Loader(ShiftLoader) loader: ShiftLoader,
  ): Promise<Event | null> {
    if (!shift.eventId) {
      return null;
    }

    return loader.eventById.load(shift.eventId);
  }

  @AllowAnonymous()
  @ResolveField(() => OrganizationUnit)
  async organizationUnit(
    @Parent() shift: ShiftEntity,
    @Loader(ShiftLoader) loader: ShiftLoader,
  ): Promise<OrganizationUnit> {
    return loader.organizationUnitById.load(shift.organizationUnitId);
  }

  @AllowAnonymous()
  @ResolveField(() => Organization)
  async organization(
    @Parent() shift: ShiftEntity,
    @Loader(ShiftLoader) loader: ShiftLoader,
  ): Promise<Organization> {
    return loader.organizationByUnitId.load(shift.organizationUnitId);
  }
}
