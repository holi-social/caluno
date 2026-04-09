'use server';

import { getDataClient } from '@/lib/data-client';

interface ShiftInstance {
  id: string;
  title: string;
  volunteers: Array<{ id: string; name: string; email: string }>;
}

interface Volunteer {
  id: string;
  name: string;
  email: string;
}

interface GetAvailableShiftsWithVolunteers {
  shifts: ShiftInstance[];
  allVolunteers: Volunteer[];
}

export async function getAvailableShiftsWithVolunteers(
  organizationUnitId: string,
  organizationId: string,
): Promise<GetAvailableShiftsWithVolunteers> {
  const data = await getDataClient(organizationUnitId);

  try {
    const [activeShifts, allVolunteers] = await Promise.all([
      data.shift.activeShifts(),
      data.organization.findVolunteers(organizationId),
    ]);

    return {
      shifts: (
        activeShifts.items as Array<{
          id: string;
          master: { title: string };
          volunteers?: Array<{ id: string; name: string; email: string }>;
        }>
      ).map((instance) => ({
        id: instance.id,
        title: instance.master.title,
        volunteers: instance.volunteers || [],
      })),
      allVolunteers:
        (
          allVolunteers as
            | Array<{ id: string; name: string; email: string }>
            | undefined
        )?.map((volunteer) => ({
          id: volunteer.id,
          name: volunteer.name,
          email: volunteer.email,
        })) || [],
    };
  } catch (error) {
    console.error('Error fetching shifts and volunteers:', error);
    return {
      shifts: [],
      allVolunteers: [],
    };
  }
}
