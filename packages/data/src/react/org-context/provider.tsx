'use client';

import { createContext, type ReactNode, useContext } from 'react';

export interface OrganizationData {
  id: string;
  organizationId: string;
  slug: string;
  name: string;
  description?: string | null;
  logoUrl?: string | null;
  address?: string | null;
  accountingEnabled: boolean;
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

export function useOrg(): OrgContextValue {
  const context = useContext(OrgContext);
  if (!context) {
    throw new Error('useOrg must be used within OrgProvider');
  }
  return context;
}

export function useOrgUId(): string {
  return useOrg().org.id;
}

export function useOrgSlug(): string {
  return useOrg().org.slug;
}

export function useCurrentOrg(): OrganizationData {
  return useOrg().org;
}

export function useUserOrganizations(): OrganizationData[] {
  return useOrg().organizations;
}
