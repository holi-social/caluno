import { Inject, Injectable } from '@nestjs/common';
import type { Database } from '../database/database.module';
import { DATABASE_CONNECTION } from '../database/database-connection';
import { ForbiddenGraphQLError } from '../graphql/errors';

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
    const unit = await this.db.query.organizationUnits.findFirst({
      where: { id: organizationUnitId, organizationId },
      columns: { id: true },
    });

    if (!unit) {
      throw new ForbiddenGraphQLError(
        'You can only perform this action if you are a member of an organization unit within this organization.',
      );
    }
  }
}
