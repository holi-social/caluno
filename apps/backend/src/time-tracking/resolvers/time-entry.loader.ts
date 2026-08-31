import { Injectable, Scope } from '@nestjs/common';
import DataLoader from 'dataloader';
import { NotFoundGraphQLError } from '../../graphql/errors';
import { RegisterLoader } from '../../graphql/interceptors';
import { OrganizationUnitMapper } from '../../organization/mappers/organization-unit.mapper';
import type { OrganizationUnit } from '../../organization/models/organization-unit.model';
import { OrganizationUnitDataService } from '../../organization/organization-unit-data.service';

@RegisterLoader()
@Injectable({ scope: Scope.REQUEST })
export class TimeEntryLoader {
  constructor(
    private readonly organizationUnitDataService: OrganizationUnitDataService,
    private readonly organizationUnitMapper: OrganizationUnitMapper,
  ) {}

  public readonly organizationUnitById = new DataLoader<
    string,
    OrganizationUnit
  >(async (unitIds) => {
    const units = await this.organizationUnitDataService.findByIds([
      ...unitIds,
    ]);
    const byId = new Map(units.map((unit) => [unit.id, unit]));

    return unitIds.map((id) => {
      const unit = byId.get(id);
      if (!unit) {
        return new NotFoundGraphQLError(
          `Organization unit with ID ${id} not found`,
        );
      }
      return this.organizationUnitMapper.toModelOrThrow(unit);
    });
  });
}
