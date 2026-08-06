import { Int, Parent, ResolveField, Resolver } from '@nestjs/graphql';
import {
  AllowAnonymous,
  Session,
  type UserSession,
} from '@thallesp/nestjs-better-auth';
import { plainToInstance } from 'class-transformer';
import { Loader } from '../../graphql/decorators/loader.decorator';
import { Organization } from '../../organization/models/organization.model';
import { OrganizationUnit } from '../../organization/models/organization-unit.model';
import { RequiredFormRef } from '../../organization/models/organization-unit-required-form.model';
import { RequirementForm } from '../../requirement-profile/models/requirement-form.model';
import { UserMapper } from '../../user/mappers/user.mapper';
import { User } from '../../user/models/user.model';
import { ShiftInstanceMapper } from '../mappers/shift-instance.mapper';
import { Shift } from '../models/shift.model';
import { ShiftInstance } from '../models/shift-instance.model';
import type { ShiftEntity } from '../schemas/shift.schema';
import { ShiftService } from '../shift.service';
import { ShiftLoader } from './shift.loader';
import { ShiftInstanceLoader } from './shift-instance.loader';
import { ShiftRequiredFormsLoader } from './shift-required-forms.loader';

@Resolver(() => Shift)
export class ShiftFieldResolver {
  constructor(
    private readonly shiftService: ShiftService,
    private readonly userMapper: UserMapper,
    private readonly shiftInstanceMapper: ShiftInstanceMapper,
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

  @AllowAnonymous()
  @ResolveField(() => [ShiftInstance])
  async instances(
    @Parent() shift: ShiftEntity,
    @Loader(ShiftInstanceLoader) loader: ShiftInstanceLoader,
  ): Promise<ShiftInstance[]> {
    const rows = await loader.instancesByShiftId.load(shift.id);
    return this.shiftInstanceMapper.toArray(rows);
  }

  @AllowAnonymous()
  @ResolveField(() => Int)
  async requiredFormsCount(
    @Parent() shift: ShiftEntity,
    @Loader(ShiftRequiredFormsLoader) loader: ShiftRequiredFormsLoader,
  ): Promise<number> {
    return loader.countByShiftId.load(shift.id);
  }

  @AllowAnonymous()
  @ResolveField(() => [RequiredFormRef])
  async requiredForms(
    @Parent() shift: ShiftEntity,
    @Loader(ShiftRequiredFormsLoader) loader: ShiftRequiredFormsLoader,
  ): Promise<RequiredFormRef[]> {
    const requiredForms = await loader.requiredFormsByShiftId.load(shift.id);

    return requiredForms.map(({ form, order }) => ({
      form: plainToInstance(RequirementForm, form),
      order,
    }));
  }
}
