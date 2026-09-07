import { Injectable } from '@nestjs/common';
import { MembershipService } from '../../membership/membership.service';
import { ContractService } from './contract.service';
import {
  computeInviteAllowanceState,
  InviteAllowanceState,
} from './invite-allowance-eligibility';
import { ReimbursementRateService } from './reimbursement-rate.service';

export interface VolunteerInviteAllowanceResult {
  volunteerId: string;
  state: InviteAllowanceState;
}

export interface GetInviteAllowanceStatesInput {
  organizationId: string;
  organizationUnitId: string;
  reimbursementTypeId: string;
  /** Planned duration of the shift the volunteer would be invited to. */
  shiftDurationMinutes: number;
  /** Defaults to the current calendar year. */
  year?: number;
}

@Injectable()
export class InviteAllowanceEligibilityService {
  constructor(
    private readonly membershipService: MembershipService,
    private readonly contractService: ContractService,
    private readonly reimbursementRateService: ReimbursementRateService,
  ) {}

  /**
   * One allowance state per member of `organizationUnitId`, for inviting
   * them to a shift paid at `reimbursementTypeId` and lasting
   * `shiftDurationMinutes`.
   *
   * Deliberately reuses two existing, already-tested computations instead of
   * re-deriving either:
   *  - `ReimbursementRateService.getRosterYearlyUsage` for the year-to-date
   *    payout sum — the same call the roster/accounting views make. Its
   *    year window is what VOLI-1244 fixes; this service does not touch that
   *    logic, so it picks up the fix automatically once VOLI-1244 lands and
   *    this branch is rebased/merged onto it — no changes needed here.
   *  - `ContractService.findActiveContract` for the "has a signed
   *    agreement" check — the same check VOLI-1243's "no Vereinbarung"
   *    state is built on.
   *
   * This is what keeps these states consistent with what the accounting
   * surfaces report for the same volunteer (acceptance criterion 8).
   */
  async getInviteAllowanceStates(
    input: GetInviteAllowanceStatesInput,
  ): Promise<VolunteerInviteAllowanceResult[]> {
    const year = input.year ?? new Date().getFullYear();

    const [members, usage, hourlyRateCents] = await Promise.all([
      this.membershipService.getMembers(input.organizationUnitId),
      this.reimbursementRateService.getRosterYearlyUsage(
        input.organizationUnitId,
        year,
      ),
      this.reimbursementRateService.getEffectiveRateCents(
        input.organizationId,
        input.organizationUnitId,
        input.reimbursementTypeId,
      ),
    ]);

    const projectedCostCents = Math.round(
      (hourlyRateCents * input.shiftDurationMinutes) / 60,
    );

    const usageByVolunteerId = new Map(
      usage.map((entry) => [entry.volunteer.id, entry.usageByType]),
    );

    return Promise.all(
      members.map(async (member) => {
        const contract = await this.contractService.findActiveContract(
          member.id,
          input.reimbursementTypeId,
        );

        const typeUsage = usageByVolunteerId
          .get(member.id)
          ?.find(
            (usageEntry) =>
              usageEntry.reimbursementType.id === input.reimbursementTypeId,
          );

        const state = computeInviteAllowanceState({
          hasActiveAgreement: Boolean(contract),
          remainingCents: typeUsage?.remainingCents ?? 0,
          limitCents: typeUsage?.limitCents ?? 0,
          projectedCostCents,
        });

        return { volunteerId: member.id, state };
      }),
    );
  }
}
