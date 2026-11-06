import { Injectable, Scope } from '@nestjs/common';
import DataLoader from 'dataloader';
import { NotFoundGraphQLError } from '../../graphql/errors';
import { RegisterLoader } from '../../graphql/interceptors';
import { OrganizationMapper } from '../../organization/mappers/organization.mapper';
import { OrganizationUnitMapper } from '../../organization/mappers/organization-unit.mapper';
import type { Organization } from '../../organization/models/organization.model';
import type { OrganizationUnit } from '../../organization/models/organization-unit.model';
import { OrganizationUnitDataService } from '../../organization/organization-unit-data.service';
import { ShiftMapper } from '../mappers/shift.mapper';
import { Shift } from '../models/shift.model';
import { ShiftService } from '../shift.service';

@RegisterLoader()
@Injectable({ scope: Scope.REQUEST })
export class ShiftLoader {
  constructor(
    private readonly organizationUnitDataService: OrganizationUnitDataService,
    private readonly organizationMapper: OrganizationMapper,
    private readonly organizationUnitMapper: OrganizationUnitMapper,
    private readonly shiftService: ShiftService,
    private readonly shiftMapper: ShiftMapper,
  ) {}

  public readonly shiftById = new DataLoader<string, Shift>(
    async (shiftIds) => {
      const shifts = await this.shiftService.findByIds([...shiftIds]);
      const byId = new Map(shifts.map((shift) => [shift.id, shift]));

      return shiftIds.map((id) => {
        const shift = byId.get(id);
        if (!shift) {
          return new NotFoundGraphQLError(`Shift with ID ${id} not found`);
        }
        return this.shiftMapper.toModelOrThrow(shift);
      });
    },
  );

  // Many shifts share a unit/org, so DataLoader dedups the repeated ids.
  public readonly organizationUnitById = new DataLoader<
    string,
    OrganizationUnit
  >((unitIds) =>
    settleEach(unitIds, async (id) =>
      this.organizationUnitMapper.toModelOrThrow(
        await this.organizationUnitDataService.findById(id),
      ),
    ),
  );

  public readonly organizationByUnitId = new DataLoader<string, Organization>(
    (unitIds) =>
      settleEach(unitIds, async (id) =>
        this.organizationMapper.toModelOrThrow(
          await this.organizationUnitDataService.findOrganizationByUnitId(id),
        ),
      ),
  );
}

async function settleEach<T>(
  ids: readonly string[],
  load: (id: string) => Promise<T>,
): Promise<(T | Error)[]> {
  return Promise.all(
    ids.map(async (id) => {
      try {
        return await load(id);
      } catch (error) {
        return error instanceof Error ? error : new Error(String(error));
      }
    }),
  );
}
