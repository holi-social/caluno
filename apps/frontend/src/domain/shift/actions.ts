'use server';

import type { CreateShiftInput, UpdateShiftInput } from '@repo/data';
import { ShiftVisibility } from '@repo/data';
import { RRule } from 'rrule';
import z from 'zod';
import { getDataClient } from '@/lib/data-client';
import { actionClient } from '@/lib/safe-action';
import {
  serverShiftDeleteSchema,
  serverShiftFormSchema,
  serverUpdateShiftFormSchema,
} from './schemas';

const dayToRRule: Record<string, number> = {
  MONDAY: RRule.MO.weekday,
  TUESDAY: RRule.TU.weekday,
  WEDNESDAY: RRule.WE.weekday,
  THURSDAY: RRule.TH.weekday,
  FRIDAY: RRule.FR.weekday,
  SATURDAY: RRule.SA.weekday,
  SUNDAY: RRule.SU.weekday,
};

function generateRrule(
  startsAt: Date,
  recurrenceDays?: string[],
  recurrenceEndsAt?: Date,
): string | null {
  if (!recurrenceDays || recurrenceDays.length === 0) {
    return null;
  }

  const weekdays = recurrenceDays
    .map((d) => dayToRRule[d])
    .filter((d): d is number => d !== undefined);

  const rule = new RRule({
    freq: RRule.WEEKLY,
    dtstart: startsAt,
    byweekday: weekdays,
    until: recurrenceEndsAt,
  });

  return rule.toString().replace(/^RRULE:/, '');
}

export async function getShift(id: string, organizationUnitId: string) {
  const data = await getDataClient(organizationUnitId);
  return data.shift.findById(id);
}

export const createShift = actionClient
  .inputSchema(serverShiftFormSchema)
  .action(async ({ parsedInput }) => {
    const data = await getDataClient(parsedInput.organizationUnitId);

    const rrule = generateRrule(
      parsedInput.startsAt,
      parsedInput.recurrenceDays,
      parsedInput.recurrenceEndsAt,
    );

    const input: CreateShiftInput = {
      title: parsedInput.name,
      startsAt: parsedInput.startsAt.toISOString(),
      endsAt: parsedInput.endsAt.toISOString(),
      instructions: parsedInput.instructions,
      location: parsedInput.location,
      visibility: ShiftVisibility.AllMembers,
      invitedMemberIds: parsedInput.invitedMemberIds,
      rrule,
    };

    return await data.shift.create(input);
  });

export const updateShift = actionClient
  .inputSchema(serverUpdateShiftFormSchema)
  .action(async ({ parsedInput }) => {
    const data = await getDataClient(parsedInput.organizationUnitId);

    const rrule = generateRrule(
      parsedInput.startsAt,
      parsedInput.recurrenceDays,
      parsedInput.recurrenceEndsAt,
    );

    const input: UpdateShiftInput = {
      title: parsedInput.name,
      startsAt: parsedInput.startsAt.toISOString(),
      endsAt: parsedInput.endsAt.toISOString(),
      instructions: parsedInput.instructions,
      location: parsedInput.location,
      invitedMemberIds: parsedInput.invitedMemberIds,
      rrule,
    };

    return await data.shift.update(parsedInput.id, input);
  });

export const deleteShift = actionClient
  .inputSchema(serverShiftDeleteSchema)
  .action(async ({ parsedInput }) => {
    const data = await getDataClient(parsedInput.organizationUnitId);

    return await data.shift.delete(parsedInput.id);
  });

const inviteShiftVolunteersSchema = z.object({
  instanceId: z.string().min(1),
  organizationUnitId: z.string().min(1),
  memberIds: z.array(z.string()),
});

export const inviteShiftVolunteers = actionClient
  .inputSchema(inviteShiftVolunteersSchema)
  .action(async ({ parsedInput }) => {
    const data = await getDataClient(parsedInput.organizationUnitId);
    return await data.shift.inviteMembers(
      parsedInput.instanceId,
      parsedInput.memberIds,
    );
  });

const updateShiftStaffingSchema = z.object({
  shiftId: z.string().min(1),
  organizationUnitId: z.string().min(1),
  minVolunteers: z.number().int().positive().nullable(),
  maxVolunteers: z.number().int().positive().nullable(),
});

export const updateShiftStaffing = actionClient
  .inputSchema(updateShiftStaffingSchema)
  .action(async ({ parsedInput }) => {
    const data = await getDataClient(parsedInput.organizationUnitId);
    await data.shift.update(parsedInput.shiftId, {
      minVolunteers: parsedInput.minVolunteers ?? undefined,
      maxVolunteers: parsedInput.maxVolunteers ?? undefined,
    });
  });
