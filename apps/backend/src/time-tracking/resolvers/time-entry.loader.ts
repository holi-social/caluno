import { Inject, Injectable, Scope } from '@nestjs/common';
import DataLoader from 'dataloader';
import { ReimbursementTypeMapper } from '../../accounting/mappers/reimbursement-type.mapper';
import type { ReimbursementType } from '../../accounting/models/reimbursement-type.model';
import type { Database } from '../../database/database.module';
import { DATABASE_CONNECTION } from '../../database/database-connection';
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
    private readonly reimbursementTypeMapper: ReimbursementTypeMapper,
    @Inject(DATABASE_CONNECTION) private readonly db: Database,
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

  public readonly reimbursementTypeById = new DataLoader<
    string,
    ReimbursementType
  >(async (ids) => {
    const types = await this.db.query.reimbursementTypes.findMany({
      where: { id: { in: [...ids] } },
    });
    const byId = new Map(types.map((type) => [type.id, type]));

    return ids.map((id) => {
      const type = byId.get(id);
      if (!type) {
        return new NotFoundGraphQLError(
          `Reimbursement type with ID ${id} not found`,
        );
      }
      return this.reimbursementTypeMapper.toModelOrThrow(type);
    });
  });
}
