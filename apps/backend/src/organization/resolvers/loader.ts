import { Injectable, Scope } from '@nestjs/common';
import DataLoader from 'dataloader';
import { OrganizationUnitEntity } from '../../database/schema';
import { RegisterLoader } from '../../graphql/interceptors';
import { OrganizationUnitMapper } from '../mappers/organization-unit.mapper';
import { OrganizationUnit } from '../models/organization-unit.model';
import { OrganizationService } from '../organization.service';

@RegisterLoader()
@Injectable({ scope: Scope.REQUEST })
export class OrganizationLoader {
  constructor(
    private readonly organizationService: OrganizationService,
    private readonly organizationUnitMapper: OrganizationUnitMapper,
  ) {}

  public readonly unitsByOrgId = new DataLoader<string, OrganizationUnit[]>(
    async (orgIds: readonly string[]) => {
      const units = await this.organizationService.findUnitsByOrgIds(
        orgIds as string[],
      );

      const unitsByOrgId = new Map<string, OrganizationUnitEntity[]>();

      for (const unit of units) {
        const existingUnits = unitsByOrgId.get(unit.organizationId) ?? [];
        existingUnits.push(unit);
        unitsByOrgId.set(unit.organizationId, existingUnits);
      }

      return orgIds.map((orgId) => {
        return this.organizationUnitMapper.toArray(
          unitsByOrgId.get(orgId) ?? [],
        );
      });
    },
  );
}
