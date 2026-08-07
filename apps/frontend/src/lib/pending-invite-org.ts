import { cookies } from 'next/headers';
import { getDataClient } from './data-client';

export interface PendingInviteOrg {
  id: string;
  name: string;
  logoUrl: string | null;
}

/**
 * Load the public org unit for auth-page invite context.
 * Prefer an explicit org unit id (e.g. signup ↔ login toggle links),
 * otherwise use the `pending_invite` cookie.
 */
export async function resolvePendingInviteOrg(
  orgUIdOverride?: string | null,
): Promise<PendingInviteOrg | null> {
  const cookieStore = await cookies();
  const orgUId =
    orgUIdOverride?.trim() || cookieStore.get('pending_invite')?.value;
  if (!orgUId) return null;

  try {
    const data = await getDataClient();
    const unit = await data.publicOrganizationUnit.findById(orgUId);
    return {
      id: unit.id,
      name: unit.name,
      logoUrl: unit.logoUrl ?? null,
    };
  } catch {
    return null;
  }
}
