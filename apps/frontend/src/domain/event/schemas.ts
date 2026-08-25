import z from 'zod';

interface EventSchemaMessages {
  titleRequired: string;
  startRequired: string;
  endRequired: string;
  endAfterStart: string;
}

function createEventFormBase(t: EventSchemaMessages) {
  return {
    title: z.string().trim().min(1, t.titleRequired),
    startsAt: z.date(t.startRequired),
    endsAt: z.date(t.endRequired),
    location: z.string().trim().optional(),
    logoFileId: z.uuid().nullish(),
    coverFileId: z.uuid().nullish(),
  };
}

export function eventFormSchema(t: EventSchemaMessages) {
  return z.object(createEventFormBase(t)).refine((d) => d.endsAt > d.startsAt, {
    message: t.endAfterStart,
    path: ['endsAt'],
  });
}

export const clientEventFormSchema = eventFormSchema({
  titleRequired: 'Title is required',
  startRequired: 'Start date is required',
  endRequired: 'End date is required',
  endAfterStart: 'End date must be after start date',
});

export type EventFormClientValues = z.infer<typeof clientEventFormSchema>;

export const serverEventFormSchema = z
  .object({
    ...createEventFormBase({
      titleRequired: 'Title is required',
      startRequired: 'Start date is required',
      endRequired: 'End date is required',
      endAfterStart: 'End date must be after start date',
    }),
    requiredFormIds: z.array(z.string()).default([]),
  })
  .refine((d) => d.endsAt > d.startsAt, {
    message: 'End date must be after start date',
    path: ['endsAt'],
  });

export type EventFormValues = z.infer<typeof serverEventFormSchema>;

export const serverEventInviteFormSchema = z.object({
  memberIds: z.array(z.string()),
});

export type EventInviteFormValues = z.infer<typeof serverEventInviteFormSchema>;
