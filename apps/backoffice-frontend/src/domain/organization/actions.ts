'use server';

import { getDataClient } from '@/lib/data-client';

export async function getVolunteers(organizationId: string) {
  const data = await getDataClient(organizationId);

  return await data.organization.findVolunteers(organizationId);
}
