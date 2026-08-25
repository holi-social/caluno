import { Args, Mutation, Resolver } from '@nestjs/graphql';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { Session } from '@thallesp/nestjs-better-auth';
import { AuthService } from '../../auth/auth.service';
import { PERMISSIONS } from '../../auth/constants';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { ForbiddenGraphQLError } from '../../graphql/errors';
import { RequiredFormTargetType } from '../../requirement-profile/enums';
import { RequiredFormRefMapper } from '../../requirement-profile/mappers/required-form-ref.mapper';
import { RequiredFormService } from '../../requirement-profile/services/required-form.service';
import { CreateOrganizationUnitInput } from '../inputs/create-organization-unit.input';
import { UpdateOrganizationUnitInput } from '../inputs/update-organization-unit.input';
import { OrganizationUnitMapper } from '../mappers/organization-unit.mapper';
import { OrganizationUnit } from '../models/organization-unit.model';
import { RequiredFormRef } from '../models/organization-unit-required-form.model';
import { OrganizationUnitService } from '../organization-unit.service';

@Resolver(() => OrganizationUnit)
export class OrganizationUnitMutationResolver {
  constructor(
    private readonly organizationUnitService: OrganizationUnitService,
    private readonly organizationUnitMapper: OrganizationUnitMapper,
    private readonly authService: AuthService,
    private readonly requiredFormService: RequiredFormService,
    private readonly requiredFormRefMapper: RequiredFormRefMapper,
  ) {}

  private async assertCanConfigureRequiredForms(
    userId: string,
    organizationUnitId: string,
  ): Promise<void> {
    const keys = await this.authService.findUserPermissionKeys(
      userId,
      organizationUnitId,
    );
    if (
      !keys.has(PERMISSIONS.ORG_EDIT) &&
      !keys.has(PERMISSIONS.REQUIREMENT_PROFILE_EDIT)
    ) {
      throw new ForbiddenGraphQLError(
        'You do not have permission to configure required forms',
      );
    }
  }

  @Permissions(PERMISSIONS.ORG_EDIT)
  @Mutation(() => OrganizationUnit)
  async createOrganizationUnit(
    @Args('input') input: CreateOrganizationUnitInput,
    @Session() session: UserSession,
  ): Promise<OrganizationUnit> {
    const organizationUnit = await this.organizationUnitService.create(
      session.user.id,
      input,
    );
    return this.organizationUnitMapper.toModelOrThrow(organizationUnit);
  }

  @Permissions(PERMISSIONS.ORG_EDIT)
  @Mutation(() => OrganizationUnit)
  async updateOrganizationUnit(
    @Args('id') id: string,
    @Args('input') input: UpdateOrganizationUnitInput,
  ): Promise<OrganizationUnit> {
    const organizationUnit = await this.organizationUnitService.update(
      id,
      input,
    );
    return this.organizationUnitMapper.toModelOrThrow(organizationUnit);
  }

  @Permissions(PERMISSIONS.ORG_EDIT)
  @Mutation(() => OrganizationUnit)
  async deleteOrganizationUnit(
    @Args('id') id: string,
  ): Promise<OrganizationUnit> {
    const organizationUnit = await this.organizationUnitService.delete(id);
    return this.organizationUnitMapper.toModelOrThrow(organizationUnit);
  }

  @Mutation(() => [RequiredFormRef])
  async setRequiredForms(
    @Args('organizationUnitId') organizationUnitId: string,
    @Args('formIds', { type: () => [String] }) formIds: string[],
    @Session() session: UserSession,
  ): Promise<RequiredFormRef[]> {
    await this.assertCanConfigureRequiredForms(
      session.user.id,
      organizationUnitId,
    );

    const requiredForms = await this.requiredFormService.setRequiredForms(
      {
        targetType: RequiredFormTargetType.ORGANIZATION_UNIT,
        targetId: organizationUnitId,
      },
      formIds,
    );

    return this.requiredFormRefMapper.toArray(requiredForms);
  }
}
