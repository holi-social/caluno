import { Inject, Injectable } from '@nestjs/common';
import type { Database } from '../database/database.module';
import { DATABASE_CONNECTION } from '../database/database-connection';
import { isUnitInOrg } from '../requirement-profile/services/is-unit-in-org';

@Injectable()
export class OrgAccessService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: Database,
  ) {}

  async verifyUnitInOrg(
    organizationUnitId: string,
    organizationId: string,
  ): Promise<void> {
    await isUnitInOrg(this.db, organizationUnitId, organizationId);
  }
}
