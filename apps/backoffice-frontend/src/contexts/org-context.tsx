'use client';

import { createContext, type ReactNode, useContext } from 'react';

interface OrgContextValue {
  org: {
    id: string;
    slug: string;
    name: string;
    description?: string | null;
    logoUrl?: string | null;
  };
  organizations: Array<{
    id: string;
    slug: string;
    name: string;
    description?: string | null;
    logoUrl?: string | null;
  }>;
}

const OrgContext = createContext<OrgContextValue | null>(null);

export function OrgProvider({
  children,
  org,
  organizations,
}: {
  children: ReactNode;
  org: OrgContextValue['org'];
  organizations: OrgContextValue['organizations'];
}) {
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

export function useOrgId(): string {
  return useOrg().org.id;
}

export function useOrgSlug(): string {
  return useOrg().org.slug;
}

export function useOrganizations(): OrgContextValue['organizations'] {
  return useOrg().organizations;
}
