'use client';

import { createContext, type ReactNode, useContext } from 'react';

export interface OrganizationData {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  logoUrl?: string | null;
}

interface OrgContextValue {
  org: OrganizationData;
  organizations: OrganizationData[];
}

const OrgContext = createContext<OrgContextValue | null>(null);

export interface OrgProviderProps {
  children: ReactNode;
  org: OrganizationData;
  organizations: OrganizationData[];
}

/**
 * Organization context provider.
 * Provides current organization and list of user's organizations to all child components.
 *
 * @example
 * <OrgProvider org={currentOrg} organizations={userOrgs}>
 *   <App />
 * </OrgProvider>
 */
export function OrgProvider({
  children,
  org,
  organizations,
}: OrgProviderProps) {
  return (
    <OrgContext.Provider value={{ org, organizations }}>
      {children}
    </OrgContext.Provider>
  );
}

/**
 * Hook to access full org context (current org + all organizations).
 * @throws Error if used outside OrgProvider
 */
export function useOrg(): OrgContextValue {
  const context = useContext(OrgContext);
  if (!context) {
    throw new Error('useOrg must be used within OrgProvider');
  }
  return context;
}

/**
 * Hook to access current organization ID.
 * @throws Error if used outside OrgProvider
 */
export function useOrgId(): string {
  return useOrg().org.id;
}

/**
 * Hook to access current organization slug.
 * @throws Error if used outside OrgProvider
 */
export function useOrgSlug(): string {
  return useOrg().org.slug;
}

/**
 * Hook to access current organization data.
 * @throws Error if used outside OrgProvider
 */
export function useCurrentOrg(): OrganizationData {
  return useOrg().org;
}

/**
 * Hook to access all organizations the user has access to.
 * Returns the list from the provider (no fetching).
 * @throws Error if used outside OrgProvider
 */
export function useUserOrganizations(): OrganizationData[] {
  return useOrg().organizations;
}
