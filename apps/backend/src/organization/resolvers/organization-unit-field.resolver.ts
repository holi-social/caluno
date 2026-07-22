import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { plainToInstance } from 'class-transformer';
import { RequirementForm } from '../../requirement-profile/models/requirement-form.model';
import { RequirementProfile } from '../../requirement-profile/models/requirement-profile.model';
import { RequirementProfileService } from '../../requirement-profile/services';
import { RequiredFormService } from '../../requirement-profile/services/required-form.service';
import { OrganizationMapper } from '../mappers/organization.mapper';
import { OrganizationUnitMapper } from '../mappers/organization-unit.mapper';
import { OrganizationUnitTypeMapper } from '../mappers/organization-unit-type.mapper';
import { Organization } from '../models/organization.model';
import { OrganizationUnit } from '../models/organization-unit.model';
import { RequiredFormRef } from '../models/organization-unit-required-form.model';
import { OrganizationUnitType } from '../models/organization-unit-type.model';
import { OrganizationUnitService } from '../organization-unit.service';
import type { OrganizationUnitEntity } from '../schemas/organization-unit.schema';

@Resolver(() => OrganizationUnit)
export class OrganizationUnitFieldResolver {
  constructor(
    private readonly organizationUnitService: OrganizationUnitService,
    private readonly organizationMapper: OrganizationMapper,
    private readonly organizationUnitMapper: OrganizationUnitMapper,
    private readonly organizationUnitTypeMapper: OrganizationUnitTypeMapper,
    private readonly requirementProfileService: RequirementProfileService,
    private readonly requiredFormService: RequiredFormService,
  ) {}
  @ResolveField(() => Organization)
  async organization(
    @Parent() organizationUnit: OrganizationUnitEntity,
  ): Promise<Organization> {
    const organization = await this.organizationUnitService.findOrganization(
      organizationUnit.organizationId,
    );
    return this.organizationMapper.toModelOrThrow(organization);
  }

  @ResolveField(() => OrganizationUnitType)
  async type(
    @Parent() organizationUnit: OrganizationUnitEntity,
  ): Promise<OrganizationUnitType> {
    const organizationUnitType = await this.organizationUnitService.findType(
      organizationUnit.typeId,
    );
    return this.organizationUnitTypeMapper.toModelOrThrow(organizationUnitType);
  }

  @ResolveField(() => OrganizationUnit, { nullable: true })
  async parent(
    @Parent() organizationUnit: OrganizationUnitEntity,
  ): Promise<OrganizationUnit | null> {
    if (!organizationUnit.parentId) {
      return null;
    }

    const parent = await this.organizationUnitService.findParent(
      organizationUnit.parentId,
    );
    return this.organizationUnitMapper.toModel(parent);
  }

  @ResolveField(() => [OrganizationUnit])
  async children(
    @Parent() organizationUnit: OrganizationUnitEntity,
  ): Promise<OrganizationUnit[]> {
    const children = await this.organizationUnitService.findChildren(
      organizationUnit.id,
    );
    return this.organizationUnitMapper.toArray(children);
  }

  @ResolveField(() => RequirementProfile, { nullable: true })
  async requiredMembershipRequirementProfile(
    @Parent() organizationUnit: OrganizationUnitEntity,
  ): Promise<RequirementProfile | null> {
    if (!organizationUnit.requiredMembershipRequirementProfileId) {
      return null;
    }

    const profile = await this.requirementProfileService.findById(
      organizationUnit.requiredMembershipRequirementProfileId,
    );
    return profile ? plainToInstance(RequirementProfile, profile) : null;
  }

  @ResolveField(() => [RequiredFormRef])
  async requiredForms(
    @Parent() organizationUnit: OrganizationUnitEntity,
  ): Promise<RequiredFormRef[]> {
    const requiredForms = await this.requiredFormService.getRequiredForms(
      organizationUnit.id,
    );

    return requiredForms.map(({ form, order }) => ({
      form: plainToInstance(RequirementForm, form),
      order,
    }));
  }
}
