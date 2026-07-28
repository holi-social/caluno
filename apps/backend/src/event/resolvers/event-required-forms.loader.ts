import { Injectable, Scope } from '@nestjs/common';
import DataLoader from 'dataloader';
import { RegisterLoader } from '../../graphql/interceptors';
import { RequiredFormService } from '../../requirement-profile/services/required-form.service';

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
}
