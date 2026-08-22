import { Injectable, Scope } from '@nestjs/common';
import DataLoader from 'dataloader';
import { NotFoundGraphQLError } from '../../graphql/errors';
import { RegisterLoader } from '../../graphql/interceptors';
import { OrganizationMapper } from '../../organization/mappers/organization.mapper';
import { OrganizationUnitMapper } from '../../organization/mappers/organization-unit.mapper';
import type { Organization } from '../../organization/models/organization.model';
import type { OrganizationUnit } from '../../organization/models/organization-unit.model';
import { OrganizationService } from '../../organization/organization.service';
import { OrganizationUnitService } from '../../organization/organization-unit.service';
import { settleEach } from './settle-each';

@RegisterLoader()
@Injectable({ scope: Scope.REQUEST })
export class AccountingOrganizationLoader {
  constructor(
    private readonly organizationService: OrganizationService,
    private readonly organizationMapper: OrganizationMapper,
    private readonly organizationUnitService: OrganizationUnitService,
    private readonly organizationUnitMapper: OrganizationUnitMapper,
  ) {}

  public readonly organizationById = new DataLoader<string, Organization>(
    (ids) =>
      settleEach(ids, async (id) => {
        const organization = await this.organizationService.findById(id);
        if (!organization) {
          throw new NotFoundGraphQLError(
            `Organization with ID ${id} not found`,
          );
        }
        return this.organizationMapper.toModelOrThrow(organization);
      }),
  );

  public readonly organizationUnitById = new DataLoader<
    string,
    OrganizationUnit | null
  >((ids) =>
    Promise.all(
      ids.map(async (id) =>
        this.organizationUnitMapper.toModel(
          await this.organizationUnitService.findById(id),
        ),
      ),
    ),
  );
}
