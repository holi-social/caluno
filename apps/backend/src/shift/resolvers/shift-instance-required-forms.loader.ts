import { Injectable, Scope } from '@nestjs/common';
import DataLoader from 'dataloader';
import { RegisterLoader } from '../../graphql/interceptors';
import type { RequirementFormEntity } from '../../requirement-profile/schemas/requirement-form.schema';
import { RequiredFormService } from '../../requirement-profile/services/required-form.service';

export type ShiftInstanceRequiredFormRef = {
  form: RequirementFormEntity;
  order: number;
};

@RegisterLoader()
@Injectable({ scope: Scope.REQUEST })
export class ShiftInstanceRequiredFormsLoader {
  constructor(private readonly requiredFormService: RequiredFormService) {}

  public readonly countByShiftInstanceId = new DataLoader<string, number>(
    async (shiftInstanceIds: readonly string[]) => {
      const results =
        await this.requiredFormService.countRequiredFormsByShiftInstanceIds(
          shiftInstanceIds as string[],
        );

      const countsByInstanceId = new Map(
        results.map((row) => [row.shiftInstanceId, row.count]),
      );
      return shiftInstanceIds.map((id) => countsByInstanceId.get(id) ?? 0);
    },
  );

  public readonly requiredFormsByShiftInstanceId = new DataLoader<
    string,
    ShiftInstanceRequiredFormRef[]
  >(async (shiftInstanceIds: readonly string[]) => {
    const rows =
      await this.requiredFormService.getRequiredFormsByShiftInstanceIds(
        shiftInstanceIds as string[],
      );

    const formsByInstanceId = new Map<string, ShiftInstanceRequiredFormRef[]>();
    for (const { shiftInstanceId, form, order } of rows) {
      const existing = formsByInstanceId.get(shiftInstanceId) ?? [];
      existing.push({ form, order });
      formsByInstanceId.set(shiftInstanceId, existing);
    }

    return shiftInstanceIds.map((id) => formsByInstanceId.get(id) ?? []);
  });
}
