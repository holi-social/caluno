import type {
  GetEffectiveRatesQuery,
  GetReimbursementTypesQuery,
  GetRosterYearlyUsageQuery,
  GetYearlyUsageQuery,
} from '../../generated/graphql';
import { BaseRepository } from '../base/base.repository';

// Prefixed with `Raw` to avoid colliding with the same-named entity types
// exported from `generated/graphql.ts` (see `RawShift` in shift.repository.ts
// for the established convention).
export type RawReimbursementType =
  GetReimbursementTypesQuery['reimbursementTypes'][number];
export type RawEffectiveRate =
  GetEffectiveRatesQuery['effectiveRates'][number];
export type RawYearlyUsage = GetYearlyUsageQuery['yearlyUsage'];
export type RawVolunteerYearlyUsage =
  GetRosterYearlyUsageQuery['rosterYearlyUsage'][number];

export class AccountingRepository extends BaseRepository {
  async findReimbursementTypes(): Promise<RawReimbursementType[]> {
    const data = await this.sdk.GetReimbursementTypes();
    return data.reimbursementTypes;
  }

  async findEffectiveRates(
    organizationUnitId?: string,
  ): Promise<RawEffectiveRate[]> {
    const data = await this.sdk.GetEffectiveRates({ organizationUnitId });
    return data.effectiveRates;
  }

  async setReimbursementRate(input: {
    reimbursementTypeId: string;
    hourlyRateCents: number;
    organizationUnitId?: string;
  }) {
    const data = await this.sdk.SetReimbursementRate(input);
    return data.setReimbursementRate;
  }

  async findYearlyUsage(
    reimbursementTypeId: string,
    year: number,
  ): Promise<RawYearlyUsage> {
    const data = await this.sdk.GetYearlyUsage({ reimbursementTypeId, year });
    return data.yearlyUsage;
  }

  async findRosterYearlyUsage(
    organizationUnitId: string,
    year: number,
  ): Promise<RawVolunteerYearlyUsage[]> {
    const data = await this.sdk.GetRosterYearlyUsage({
      organizationUnitId,
      year,
    });
    return data.rosterYearlyUsage;
  }
}
