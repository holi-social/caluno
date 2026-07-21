import { Injectable, Scope } from '@nestjs/common';
import DataLoader from 'dataloader';
import { RegisterLoader } from '../../graphql/interceptors';
import { OrganizationUnitDataService } from '../../organization/organization-unit-data.service';
import type { EventOrganizationUnit } from '../models/event-organization-unit.model';

@RegisterLoader()
@Injectable({ scope: Scope.REQUEST })
export class EventOrganizationUnitLoader {
  constructor(
    private readonly organizationUnitDataService: OrganizationUnitDataService,
  ) {}

  public readonly organizationUnitById = new DataLoader<
    string,
    EventOrganizationUnit | null
  >(async (ids) => {
    const units = await this.organizationUnitDataService.findByIds(
      ids as string[],
    );
    const unitsById = new Map(units.map((unit) => [unit.id, unit]));

    return ids.map((id) => {
      const unit = unitsById.get(id);
      return unit
        ? {
            id: unit.id,
            name: unit.name,
            slug: unit.slug,
            logoUrl: unit.logoUrl ?? null,
          }
        : null;
    });
  });
}
