import { InviteAllowanceState } from './invite-allowance-eligibility';
import { InviteAllowanceEligibilityService } from './invite-allowance-eligibility.service';

const REIMBURSEMENT_TYPE_ID = 'reimbursement-type-1';
const ORGANIZATION_UNIT_ID = 'unit-1';
const ORGANIZATION_ID = 'org-1';

function buildService({
  members,
  rosterUsage,
  hourlyRateCents,
  activeContractsByVolunteerId,
}: {
  members: { id: string }[];
  rosterUsage: {
    volunteer: { id: string };
    usageByType: {
      reimbursementType: { id: string };
      usedCents: number;
      limitCents: number;
      remainingCents: number;
    }[];
  }[];
  hourlyRateCents: number;
  activeContractsByVolunteerId: Record<string, boolean>;
}) {
  const getMembers = jest.fn(() => Promise.resolve(members));
  const getRosterYearlyUsage = jest.fn(() => Promise.resolve(rosterUsage));
  const getEffectiveRateCents = jest.fn(() => Promise.resolve(hourlyRateCents));
  const findActiveContract = jest.fn((volunteerId: string) =>
    Promise.resolve(
      activeContractsByVolunteerId[volunteerId]
        ? ({ id: `contract-${volunteerId}` } as never)
        : undefined,
    ),
  );

  const membershipService = { getMembers } as never;
  const reimbursementRateService = {
    getRosterYearlyUsage,
    getEffectiveRateCents,
  } as never;
  const contractService = { findActiveContract } as never;

  const service = new InviteAllowanceEligibilityService(
    membershipService,
    contractService,
    reimbursementRateService,
  );

  return {
    service,
    getMembers,
    getRosterYearlyUsage,
    getEffectiveRateCents,
    findActiveContract,
  };
}

describe('InviteAllowanceEligibilityService', () => {
  it('reuses getRosterYearlyUsage (the shared payout-sum computation) and findActiveContract (the shared agreement check) rather than re-deriving either', async () => {
    const { service, getRosterYearlyUsage, findActiveContract } = buildService({
      members: [{ id: 'vol-1' }],
      rosterUsage: [
        {
          volunteer: { id: 'vol-1' },
          usageByType: [
            {
              reimbursementType: { id: REIMBURSEMENT_TYPE_ID },
              usedCents: 0,
              limitCents: 840_00,
              remainingCents: 840_00,
            },
          ],
        },
      ],
      hourlyRateCents: 20_00,
      activeContractsByVolunteerId: { 'vol-1': true },
    });

    await service.getInviteAllowanceStates({
      organizationId: ORGANIZATION_ID,
      organizationUnitId: ORGANIZATION_UNIT_ID,
      reimbursementTypeId: REIMBURSEMENT_TYPE_ID,
      shiftDurationMinutes: 60,
    });

    expect(getRosterYearlyUsage).toHaveBeenCalledWith(
      ORGANIZATION_UNIT_ID,
      expect.any(Number),
    );
    expect(findActiveContract).toHaveBeenCalledWith(
      'vol-1',
      REIMBURSEMENT_TYPE_ID,
    );
  });

  it('flags NO_AGREEMENT when the volunteer has no active contract', async () => {
    const { service } = buildService({
      members: [{ id: 'vol-1' }],
      rosterUsage: [
        {
          volunteer: { id: 'vol-1' },
          usageByType: [
            {
              reimbursementType: { id: REIMBURSEMENT_TYPE_ID },
              usedCents: 0,
              limitCents: 840_00,
              remainingCents: 840_00,
            },
          ],
        },
      ],
      hourlyRateCents: 20_00,
      activeContractsByVolunteerId: {},
    });

    const [result] = await service.getInviteAllowanceStates({
      organizationId: ORGANIZATION_ID,
      organizationUnitId: ORGANIZATION_UNIT_ID,
      reimbursementTypeId: REIMBURSEMENT_TYPE_ID,
      shiftDurationMinutes: 60,
    });

    expect(result).toEqual({
      volunteerId: 'vol-1',
      state: InviteAllowanceState.NO_AGREEMENT,
    });
  });

  it('projects this shift cost from the effective hourly rate and shift duration to flag WOULD_EXCEED', async () => {
    const { service, getEffectiveRateCents } = buildService({
      members: [{ id: 'vol-1' }],
      rosterUsage: [
        {
          volunteer: { id: 'vol-1' },
          usageByType: [
            {
              reimbursementType: { id: REIMBURSEMENT_TYPE_ID },
              usedCents: 830_00,
              limitCents: 840_00,
              remainingCents: 10_00,
            },
          ],
        },
      ],
      hourlyRateCents: 20_00, // 20€/h * 2h = 40€ projected cost > 10€ remaining
      activeContractsByVolunteerId: { 'vol-1': true },
    });

    const [result] = await service.getInviteAllowanceStates({
      organizationId: ORGANIZATION_ID,
      organizationUnitId: ORGANIZATION_UNIT_ID,
      reimbursementTypeId: REIMBURSEMENT_TYPE_ID,
      shiftDurationMinutes: 120,
    });

    expect(getEffectiveRateCents).toHaveBeenCalledWith(
      ORGANIZATION_ID,
      ORGANIZATION_UNIT_ID,
      REIMBURSEMENT_TYPE_ID,
    );
    expect(result).toEqual({
      volunteerId: 'vol-1',
      state: InviteAllowanceState.WOULD_EXCEED,
    });
  });
});
