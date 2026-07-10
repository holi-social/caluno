import { Injectable, Scope } from '@nestjs/common';
import DataLoader from 'dataloader';
import { EventService } from '../../event/event.service';
import { EventMapper } from '../../event/mappers/event.mapper';
import type { Event } from '../../event/models/event.model';
import { RegisterLoader } from '../../graphql/interceptors';
import { OrganizationMapper } from '../../organization/mappers/organization.mapper';
import { OrganizationUnitMapper } from '../../organization/mappers/organization-unit.mapper';
import type { Organization } from '../../organization/models/organization.model';
import type { OrganizationUnit } from '../../organization/models/organization-unit.model';
import { OrganizationUnitService } from '../../organization/organization-unit.service';

@RegisterLoader()
@Injectable({ scope: Scope.REQUEST })
export class ShiftLoader {
  constructor(
    private readonly eventService: EventService,
    private readonly organizationUnitService: OrganizationUnitService,
    private readonly eventMapper: EventMapper,
    private readonly organizationMapper: OrganizationMapper,
    private readonly organizationUnitMapper: OrganizationUnitMapper,
  ) {}

  // Many shifts share an event/unit/org, so DataLoader dedups the repeated ids.
  public readonly eventById = new DataLoader<string, Event | null>(
    async (eventIds) => {
      const events = await Promise.all(
        eventIds.map((id) => this.eventService.findByIdPublic(id)),
      );
      return events.map((event) =>
        event ? this.eventMapper.toModelOrThrow(event) : null,
      );
    },
  );

  public readonly organizationUnitById = new DataLoader<
    string,
    OrganizationUnit
  >(async (unitIds) => {
    const units = await Promise.all(
      unitIds.map((id) => this.organizationUnitService.findById(id)),
    );
    return units.map((unit) =>
      this.organizationUnitMapper.toModelOrThrow(unit),
    );
  });

  public readonly organizationByUnitId = new DataLoader<string, Organization>(
    async (unitIds) => {
      const organizations = await Promise.all(
        unitIds.map((id) =>
          this.organizationUnitService.findOrganizationByUnitId(id),
        ),
      );
      return organizations.map((organization) =>
        this.organizationMapper.toModelOrThrow(organization),
      );
    },
  );
}
