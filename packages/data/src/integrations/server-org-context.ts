/**
 * Server-side organization context utilities (framework-agnostic).
 *
 * These utilities require dependency injection of framework-specific functions
 * like cookie access, redirects, and 404 handling.
 */

import type { DataClient } from '../client/data-client';
import { LAST_ORG_COOKIE } from '../constants';

export interface OrgContextData {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  logoUrl?: string | null;
}

/**
 * Dependencies that must be provided by the consuming framework.
 */
export interface ServerOrgContextDeps {
  /**
   * Get cookie value by name.
   * @example (Next.js) async () => (await cookies()).get(LAST_ORG_COOKIE)?.value ?? null
   */
  getCookie: (name: string) => Promise<string | null>;

  /**
   * Trigger a 404 response.
   * @example (Next.js) notFound from 'next/navigation'
   */
  notFound: () => never;

  /**
   * Redirect to a path.
   * @example (Next.js) redirect from 'next/navigation'
   */
  redirect: (path: string) => never;

  /**
   * Get the data client instance.
   * Should include authentication headers from the request.
   */
  getDataClient: (orgId?: string) => Promise<DataClient>;
}

/**
 * Creates server-side org context utilities with injected dependencies.
 *
 * @example
 * ```typescript
 * // In your Next.js app
 * import { cookies } from 'next/headers';
 * import { notFound, redirect } from 'next/navigation';
 * import { createServerOrgContext } from '@repo/data';
 * import { getDataClient } from './data-client';
 *
 * export const {
 *   requireOrgAccess,
 *   resolveOrgFromSlug,
 *   validateUserOrgAccess,
 *   getLastVisitedOrgServer,
 * } = createServerOrgContext({
 *   getCookie: async (name) => (await cookies()).get(name)?.value ?? null,
 *   notFound,
 *   redirect,
 *   getDataClient,
 * });
 * ```
 */
export function createServerOrgContext(deps: ServerOrgContextDeps) {
  const { getCookie, notFound, redirect, getDataClient } = deps;

  /**
   * Resolves an organization by its slug.
   */
  async function resolveOrgFromSlug(orgSlug: string): Promise<OrgContextData> {
    try {
      const data = await getDataClient();
      const org = await data.organization.findBySlug(orgSlug);

      if (!org) {
        return notFound();
      }

      return org;
    } catch (error) {
      console.error('Failed to resolve org from slug:', error);
      return notFound();
    }
  }

  /**
   * Validates if the current user has access to an organization.
   */
  async function validateUserOrgAccess(orgId: string): Promise<boolean> {
    try {
      const data = await getDataClient();
      const myOrgs = await data.user.getMyOrganizations({
        limit: 100,
        offset: 0,
      });

      return myOrgs.items.some((org) => org.id === orgId);
    } catch (error) {
      console.error('Failed to validate org access:', error);
      return false;
    }
  }

  /**
   * Requires that the user has access to an organization.
   *
   * @throws notFound() if organization doesn't exist
   * @throws redirect('/unauthorized') if user doesn't have access
   */
  async function requireOrgAccess(
    orgSlug: string,
  ): Promise<{ org: OrgContextData; organizations: OrgContextData[] }> {
    const data = await getDataClient();
    const [org, myOrgsResult] = await Promise.all([
      data.organization.findBySlug(orgSlug),
      data.user.getMyOrganizations({ limit: 100, offset: 0 }),
    ]);

    if (!org) {
      notFound();
    }

    const hasAccess = myOrgsResult.items.some((o) => o.id === org.id);

    if (!hasAccess) {
      redirect('/unauthorized');
    }

    return {
      org,
      organizations: myOrgsResult.items,
    };
  }

  /**
   * Gets the last visited organization slug from server-side cookies.
   */
  async function getLastVisitedOrgServer(): Promise<string | null> {
    return getCookie(LAST_ORG_COOKIE);
  }

  return {
    resolveOrgFromSlug,
    validateUserOrgAccess,
    requireOrgAccess,
    getLastVisitedOrgServer,
  };
}
