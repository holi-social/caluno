'use server';

import { getDataClient } from '@/lib/data-client';

export async function getAvailableShiftsWithVolunteers(
  organizationUnitId: string,
  organizationId: string,
) {
  const data = await getDataClient(organizationUnitId);

  try {
    const [shifts, allVolunteers] = await Promise.all([
      data.shift.findAllForTimeEntryCreation(),
      data.organization.findVolunteers(organizationId),
    ]);

    return {
      shifts: shifts.map((shift) => ({
        id: shift.id,
        title: shift.title,
        volunteers: shift.volunteers || [],
      })),
      allVolunteers: allVolunteers?.map((volunteer) => ({
        id: volunteer.id,
        name: volunteer.name,
        email: volunteer.email,
      })),
    };
  } catch (error) {
    console.error('Error fetching shifts and volunteers:', error);
    return {
      shifts: [],
      allVolunteers: [],
    };
  }
}
