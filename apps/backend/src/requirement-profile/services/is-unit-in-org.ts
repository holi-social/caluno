import type { Database } from '../../database/database.module';
import { ForbiddenGraphQLError } from '../../graphql/errors';

export async function isUnitInOrg(
  db: Database,
  organizationUnitId: string,
  organizationId: string,
): Promise<void> {
  if (!organizationUnitId || !organizationId) {
    throw new ForbiddenGraphQLError(
      'You can only perform this action if you are a member of an organization unit within this organization.',
    );
  }

  const organizationUnit = await db.query.organizationUnits.findFirst({
    where: { id: organizationUnitId, organizationId },
    columns: { id: true },
  });

  if (!organizationUnit) {
    throw new ForbiddenGraphQLError(
      'You can only perform this action if you are a member of an organization unit within this organization.',
    );
  }
}
