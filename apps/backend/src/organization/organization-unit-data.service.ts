import { Inject, Injectable } from '@nestjs/common';
import type { Database } from '../database/database.module';
import { DATABASE_CONNECTION } from '../database/database-connection';
import type { OrganizationEntity } from './schemas/organization.schema';
import type { OrganizationUnitEntity } from './schemas/organization-unit.schema';

@Injectable()
export class OrganizationUnitDataService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: Database,
  ) {}

  async findById(id: string): Promise<OrganizationUnitEntity | undefined> {
    return this.db.query.organizationUnits.findFirst({
      where: { id },
    });
  }

  /** Many org units by id in one query (DataLoader batch). */
  async findByIds(ids: string[]): Promise<OrganizationUnitEntity[]> {
    if (ids.length === 0) return [];
    return this.db.query.organizationUnits.findMany({
      where: { id: { in: ids } },
    });
  }

  async findOrganizationByUnitId(
    organizationUnitId: string,
  ): Promise<OrganizationEntity | undefined> {
    const organizationUnit = await this.findById(organizationUnitId);
    if (!organizationUnit) {
      return undefined;
    }

    return this.db.query.organizations.findFirst({
      where: { id: organizationUnit.organizationId },
    });
  }

  async listInclusiveAncestorUnitIds(
    organizationUnitId: string,
  ): Promise<string[]> {
    const chain: string[] = [];
    let currentId: string | null = organizationUnitId;

    while (currentId) {
      const unit = await this.db.query.organizationUnits.findFirst({
        where: { id: currentId },
        columns: { id: true, parentId: true },
      });
      if (!unit) break;
      chain.push(unit.id);
      currentId = unit.parentId;
    }

    return chain;
  }
}
