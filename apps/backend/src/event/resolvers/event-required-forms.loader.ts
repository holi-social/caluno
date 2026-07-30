import { Injectable, Scope } from '@nestjs/common';
import DataLoader from 'dataloader';
import { RegisterLoader } from '../../graphql/interceptors';
import type { RequirementFormEntity } from '../../requirement-profile/schemas/requirement-form.schema';
import { RequiredFormService } from '../../requirement-profile/services/required-form.service';

export type EventRequiredFormRef = {
  form: RequirementFormEntity;
  order: number;
};

@RegisterLoader()
@Injectable({ scope: Scope.REQUEST })
export class EventRequiredFormsLoader {
  constructor(private readonly requiredFormService: RequiredFormService) {}

  public readonly countByEventId = new DataLoader<string, number>(
    async (eventIds: readonly string[]) => {
      const results =
        await this.requiredFormService.countRequiredFormsByEventIds(
          eventIds as string[],
        );

      const countsByEventId = new Map(
        results.map((row) => [row.eventId, row.count]),
      );

      return eventIds.map((eventId) => countsByEventId.get(eventId) ?? 0);
    },
  );

  public readonly requiredFormsByEventId = new DataLoader<
    string,
    EventRequiredFormRef[]
  >(async (eventIds: readonly string[]) => {
    const rows = await this.requiredFormService.getRequiredFormsByEventIds(
      eventIds as string[],
    );

    const formsByEventId = new Map<string, EventRequiredFormRef[]>();
    for (const { eventId, form, order } of rows) {
      const existing = formsByEventId.get(eventId) ?? [];
      existing.push({ form, order });
      formsByEventId.set(eventId, existing);
    }

    return eventIds.map((eventId) => formsByEventId.get(eventId) ?? []);
  });
}
