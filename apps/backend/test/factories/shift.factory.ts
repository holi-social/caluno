import type { INestApplication } from '@nestjs/common';
import { ShiftVisibility } from '../../src/shift/enums';
import type { CreateShiftInput } from '../../src/shift/inputs/create-shift.input';
import { graphqlRequestRequiringData } from '../helpers/graphql-request';

const defaultShiftInput: Omit<CreateShiftInput, 'title'> = {
  instructions: null,
  location: null,
  startsAt: new Date('2026-06-18T08:00:00.000Z'),
  endsAt: new Date('2026-06-18T10:00:00.000Z'),
  visibility: ShiftVisibility.ALL_MEMBERS,
  maxVolunteers: null,
  minVolunteers: null,
  invitedMemberIds: [],
  rrule: null,
};

export type CreateShiftOptions = Partial<CreateShiftInput> & {
  title?: string;
};

export const createShift = async (
  app: INestApplication,
  organizationUnitId: string,
  options: CreateShiftOptions = {},
): Promise<{ id: string }> => {
  const title = options.title ?? `Test Shift ${crypto.randomUUID()}`;
  const input = {
    ...defaultShiftInput,
    ...options,
    title,
  };

  const data = await graphqlRequestRequiringData<{
    createShift: { id: string };
  }>(
    app,
    {
      query: `
        mutation CreateShift($input: CreateShiftInput!) {
          createShift(input: $input) {
            id
          }
        }
      `,
      variables: {
        input: {
          ...input,
          startsAt:
            input.startsAt instanceof Date
              ? input.startsAt.toISOString()
              : input.startsAt,
          endsAt:
            input.endsAt instanceof Date
              ? input.endsAt.toISOString()
              : input.endsAt,
        },
      },
      headers: {
        'x-organization-unit-id': organizationUnitId,
      },
    },
    'createShift',
  );

  return data.createShift;
};
