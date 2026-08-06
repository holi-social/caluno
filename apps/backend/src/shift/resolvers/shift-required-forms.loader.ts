import { Injectable, Scope } from '@nestjs/common';
import DataLoader from 'dataloader';
import { RegisterLoader } from '../../graphql/interceptors';
import type { RequirementFormEntity } from '../../requirement-profile/schemas/requirement-form.schema';
import { RequiredFormService } from '../../requirement-profile/services/required-form.service';

export type ShiftRequiredFormRef = {
  form: RequirementFormEntity;
  order: number;
};

@RegisterLoader()
@Injectable({ scope: Scope.REQUEST })
export class ShiftRequiredFormsLoader {
  constructor(private readonly requiredFormService: RequiredFormService) {}

  public readonly countByShiftId = new DataLoader<string, number>(
    async (shiftIds: readonly string[]) => {
      const results =
        await this.requiredFormService.countRequiredFormsByShiftIds(
          shiftIds as string[],
        );

      const countsByShiftId = new Map(
        results.map((row) => [row.shiftId, row.count]),
      );

      return shiftIds.map((shiftId) => countsByShiftId.get(shiftId) ?? 0);
    },
  );

  public readonly requiredFormsByShiftId = new DataLoader<
    string,
    ShiftRequiredFormRef[]
  >(async (shiftIds: readonly string[]) => {
    const rows = await this.requiredFormService.getRequiredFormsByShiftIds(
      shiftIds as string[],
    );

    const formsByShiftId = new Map<string, ShiftRequiredFormRef[]>();
    for (const { shiftId, form, order } of rows) {
      const existing = formsByShiftId.get(shiftId) ?? [];
      existing.push({ form, order });
      formsByShiftId.set(shiftId, existing);
    }

    return shiftIds.map((shiftId) => formsByShiftId.get(shiftId) ?? []);
  });
}
