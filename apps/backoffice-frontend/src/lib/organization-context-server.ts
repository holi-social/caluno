import type { OrganizationContext } from '@repo/data';
import { cookies } from 'next/headers';
import { ORG_CONTEXT_COOKIE } from './constants';

export class NextJsOrganizationContext implements OrganizationContext {
  async getCurrentOrganizationId(): Promise<string | null> {
    const cookieStore = await cookies();
    const orgCookie = cookieStore.get(ORG_CONTEXT_COOKIE);
    return orgCookie?.value ?? null;
  }

  async setCurrentOrganizationId(organizationId: string): Promise<void> {
    const cookieStore = await cookies();

    cookieStore.set(ORG_CONTEXT_COOKIE, organizationId, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    });
  }

  async clear(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete(ORG_CONTEXT_COOKIE);
  }
}

export const organizationContext = new NextJsOrganizationContext();

export async function getCurrentOrganizationId(): Promise<string | null> {
  return organizationContext.getCurrentOrganizationId();
}

export async function requireOrganizationId(): Promise<string> {
  const orgId = await getCurrentOrganizationId();

  if (!orgId) {
    throw new Error('Organization context required');
  }

  return orgId;
}
