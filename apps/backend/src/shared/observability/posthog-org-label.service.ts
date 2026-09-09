import { Inject, Injectable } from '@nestjs/common';
import type { Database } from '../../database/database.module';
import { DATABASE_CONNECTION } from '../../database/database-connection';

export type PostHogOrgLabelInput = {
  organizationId?: string;
  organizationUnitId?: string;
};

export type PostHogOrgLabels = {
  organization_id?: string;
  organization_name?: string;
  organization_unit_id?: string;
  organization_unit_name?: string;
};

@Injectable()
export class PostHogOrgLabelService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: Database,
  ) {}

  async resolve(input: PostHogOrgLabelInput): Promise<PostHogOrgLabels> {
    const labels: PostHogOrgLabels = {};
    let organizationId = input.organizationId;

    if (input.organizationUnitId) {
      labels.organization_unit_id = input.organizationUnitId;
      const unit = await this.db.query.organizationUnits.findFirst({
        where: { id: input.organizationUnitId },
        columns: { id: true, name: true, organizationId: true },
      });
      if (unit) {
        labels.organization_unit_name = unit.name;
        organizationId = organizationId ?? unit.organizationId;
      }
    }

    if (organizationId) {
      labels.organization_id = organizationId;
      const organization = await this.db.query.organizations.findFirst({
        where: { id: organizationId },
        columns: { id: true, name: true },
      });
      if (organization) {
        labels.organization_name = organization.name;
      }
    }

    return labels;
  }
}
