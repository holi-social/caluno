jest.mock('nanoid', () => ({
  customAlphabet: () => () => 'abcdefghijkl',
}));

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { EventInviteOrigin, EventInviteStatus } from '../event/enums';
import { ShiftInviteOrigin, ShiftInviteStatus } from '../shift/enums';
import { InviteOrigin, InviteStatus } from './invite-enums';
import {
  adminUninviteTargetStatus,
  canAdminReinvite,
  canTransitionInvite,
  INVITE_STATUS_BACKFILL,
  isActiveInvite,
  isOutstandingInvite,
  isParticipatingInvite,
} from './invite-status';

describe('invite-status', () => {
  describe('isParticipatingInvite', () => {
    it('treats VOLUNTEER_JOINED + null as participating', () => {
      expect(isParticipatingInvite(InviteOrigin.VOLUNTEER_JOINED, null)).toBe(
        true,
      );
    });

    it('treats ADMIN_INVITED + VOLUNTEER_ACCEPTED as participating', () => {
      expect(
        isParticipatingInvite(
          InviteOrigin.ADMIN_INVITED,
          InviteStatus.VOLUNTEER_ACCEPTED,
        ),
      ).toBe(true);
    });

    it('treats VOLUNTEER_APPLIED + ADMIN_ACCEPTED as participating (no writers yet)', () => {
      expect(
        isParticipatingInvite(
          InviteOrigin.VOLUNTEER_APPLIED,
          InviteStatus.ADMIN_ACCEPTED,
        ),
      ).toBe(true);
    });

    it('treats ADMIN_INVITED + ADMIN_ACCEPTED as participating (no writers yet)', () => {
      expect(
        isParticipatingInvite(
          InviteOrigin.ADMIN_INVITED,
          InviteStatus.ADMIN_ACCEPTED,
        ),
      ).toBe(true);
    });

    it('does not treat outstanding invite as participating', () => {
      expect(isParticipatingInvite(InviteOrigin.ADMIN_INVITED, null)).toBe(
        false,
      );
    });

    it('does not treat ended states as participating', () => {
      expect(
        isParticipatingInvite(
          InviteOrigin.ADMIN_INVITED,
          InviteStatus.VOLUNTEER_REJECTED,
        ),
      ).toBe(false);
      expect(
        isParticipatingInvite(
          InviteOrigin.ADMIN_INVITED,
          InviteStatus.ADMIN_REJECTED,
        ),
      ).toBe(false);
      expect(
        isParticipatingInvite(
          InviteOrigin.VOLUNTEER_JOINED,
          InviteStatus.VOLUNTEER_CANCELLED,
        ),
      ).toBe(false);
      expect(
        isParticipatingInvite(
          InviteOrigin.ADMIN_INVITED,
          InviteStatus.ADMIN_CANCELLED,
        ),
      ).toBe(false);
      expect(isParticipatingInvite(null, InviteStatus.ADMIN_REJECTED)).toBe(
        false,
      );
      expect(
        isParticipatingInvite(null, InviteStatus.VOLUNTEER_CANCELLED),
      ).toBe(false);
    });

    it('works with shift and event enum aliases', () => {
      expect(
        isParticipatingInvite(ShiftInviteOrigin.VOLUNTEER_JOINED, null),
      ).toBe(true);
      expect(
        isParticipatingInvite(
          EventInviteOrigin.ADMIN_INVITED,
          EventInviteStatus.VOLUNTEER_ACCEPTED,
        ),
      ).toBe(true);
    });
  });

  describe('isOutstandingInvite', () => {
    it('is ADMIN_INVITED + null only', () => {
      expect(isOutstandingInvite(InviteOrigin.ADMIN_INVITED, null)).toBe(true);
      expect(isOutstandingInvite(InviteOrigin.VOLUNTEER_JOINED, null)).toBe(
        false,
      );
      expect(
        isOutstandingInvite(
          InviteOrigin.ADMIN_INVITED,
          InviteStatus.VOLUNTEER_ACCEPTED,
        ),
      ).toBe(false);
    });
  });

  describe('isActiveInvite', () => {
    it('includes participating and outstanding', () => {
      expect(isActiveInvite(InviteOrigin.ADMIN_INVITED, null)).toBe(true);
      expect(isActiveInvite(InviteOrigin.VOLUNTEER_JOINED, null)).toBe(true);
      expect(isActiveInvite(null, InviteStatus.ADMIN_REJECTED)).toBe(false);
    });
  });

  describe('adminUninviteTargetStatus', () => {
    it('maps outstanding invite to ADMIN_REJECTED', () => {
      expect(adminUninviteTargetStatus(InviteOrigin.ADMIN_INVITED, null)).toBe(
        InviteStatus.ADMIN_REJECTED,
      );
    });

    it('maps participating to ADMIN_CANCELLED', () => {
      expect(
        adminUninviteTargetStatus(
          InviteOrigin.ADMIN_INVITED,
          InviteStatus.VOLUNTEER_ACCEPTED,
        ),
      ).toBe(InviteStatus.ADMIN_CANCELLED);
      expect(
        adminUninviteTargetStatus(InviteOrigin.VOLUNTEER_JOINED, null),
      ).toBe(InviteStatus.ADMIN_CANCELLED);
    });

    it('returns null when the row cannot be uninvited', () => {
      expect(
        adminUninviteTargetStatus(null, InviteStatus.ADMIN_REJECTED),
      ).toBeNull();
      expect(
        adminUninviteTargetStatus(
          InviteOrigin.ADMIN_INVITED,
          InviteStatus.VOLUNTEER_REJECTED,
        ),
      ).toBeNull();
    });
  });

  describe('canAdminReinvite', () => {
    it('is true for ADMIN_REJECTED and ADMIN_CANCELLED', () => {
      expect(canAdminReinvite(null, InviteStatus.ADMIN_REJECTED)).toBe(true);
      expect(
        canAdminReinvite(
          InviteOrigin.ADMIN_INVITED,
          InviteStatus.ADMIN_CANCELLED,
        ),
      ).toBe(true);
      expect(canAdminReinvite(InviteOrigin.ADMIN_INVITED, null)).toBe(false);
    });
  });

  describe('canTransitionInvite', () => {
    it('allows idempotent transitions', () => {
      expect(
        canTransitionInvite(
          InviteOrigin.ADMIN_INVITED,
          null,
          InviteOrigin.ADMIN_INVITED,
          null,
        ),
      ).toBe(true);
    });

    it('allows volunteer accept/decline and admin withdraw from outstanding', () => {
      expect(
        canTransitionInvite(
          InviteOrigin.ADMIN_INVITED,
          null,
          InviteOrigin.ADMIN_INVITED,
          InviteStatus.VOLUNTEER_ACCEPTED,
        ),
      ).toBe(true);
      expect(
        canTransitionInvite(
          InviteOrigin.ADMIN_INVITED,
          null,
          InviteOrigin.ADMIN_INVITED,
          InviteStatus.VOLUNTEER_REJECTED,
        ),
      ).toBe(true);
      expect(
        canTransitionInvite(
          InviteOrigin.ADMIN_INVITED,
          null,
          InviteOrigin.ADMIN_INVITED,
          InviteStatus.ADMIN_REJECTED,
        ),
      ).toBe(true);
    });

    it('allows volunteer leave and admin kick from participating', () => {
      expect(
        canTransitionInvite(
          InviteOrigin.ADMIN_INVITED,
          InviteStatus.VOLUNTEER_ACCEPTED,
          InviteOrigin.ADMIN_INVITED,
          InviteStatus.VOLUNTEER_CANCELLED,
        ),
      ).toBe(true);
      expect(
        canTransitionInvite(
          InviteOrigin.VOLUNTEER_JOINED,
          null,
          InviteOrigin.VOLUNTEER_JOINED,
          InviteStatus.ADMIN_CANCELLED,
        ),
      ).toBe(true);
    });

    it('allows re-invite from ADMIN_REJECTED and ADMIN_CANCELLED', () => {
      expect(
        canTransitionInvite(
          null,
          InviteStatus.ADMIN_REJECTED,
          InviteOrigin.ADMIN_INVITED,
          null,
        ),
      ).toBe(true);
      expect(
        canTransitionInvite(
          InviteOrigin.ADMIN_INVITED,
          InviteStatus.ADMIN_CANCELLED,
          InviteOrigin.ADMIN_INVITED,
          null,
        ),
      ).toBe(true);
    });

    it('allows volunteer to accept after declining', () => {
      expect(
        canTransitionInvite(
          InviteOrigin.ADMIN_INVITED,
          InviteStatus.VOLUNTEER_REJECTED,
          InviteOrigin.ADMIN_INVITED,
          InviteStatus.VOLUNTEER_ACCEPTED,
        ),
      ).toBe(true);
    });

    it('allows volunteer rejoin from cancelled via open join', () => {
      expect(
        canTransitionInvite(
          null,
          InviteStatus.VOLUNTEER_CANCELLED,
          InviteOrigin.VOLUNTEER_JOINED,
          null,
        ),
      ).toBe(true);
      expect(
        canTransitionInvite(
          InviteOrigin.VOLUNTEER_JOINED,
          InviteStatus.VOLUNTEER_CANCELLED,
          InviteOrigin.VOLUNTEER_JOINED,
          null,
        ),
      ).toBe(true);
    });

    it('rejects invalid transitions', () => {
      expect(
        canTransitionInvite(
          InviteOrigin.ADMIN_INVITED,
          null,
          InviteOrigin.ADMIN_INVITED,
          InviteStatus.VOLUNTEER_CANCELLED,
        ),
      ).toBe(false);
      expect(
        canTransitionInvite(
          InviteOrigin.ADMIN_INVITED,
          InviteStatus.VOLUNTEER_REJECTED,
          InviteOrigin.ADMIN_INVITED,
          InviteStatus.VOLUNTEER_CANCELLED,
        ),
      ).toBe(false);
      expect(
        canTransitionInvite(
          null,
          InviteStatus.VOLUNTEER_CANCELLED,
          InviteOrigin.ADMIN_INVITED,
          null,
        ),
      ).toBe(false);
    });
  });

  describe('INVITE_STATUS_BACKFILL', () => {
    it('maps every legacy status including null origin for rejected/cancelled', () => {
      expect(INVITE_STATUS_BACKFILL).toEqual({
        INVITED: { origin: InviteOrigin.ADMIN_INVITED, status: null },
        ACCEPTED: {
          origin: InviteOrigin.ADMIN_INVITED,
          status: InviteStatus.VOLUNTEER_ACCEPTED,
        },
        SELF_JOINED: { origin: InviteOrigin.VOLUNTEER_JOINED, status: null },
        VOLUNTEER_REJECTED: {
          origin: InviteOrigin.ADMIN_INVITED,
          status: InviteStatus.VOLUNTEER_REJECTED,
        },
        ADMIN_REJECTED: { origin: null, status: InviteStatus.ADMIN_REJECTED },
        CANCELLED: { origin: null, status: InviteStatus.VOLUNTEER_CANCELLED },
      });
    });
  });

  it('shift and event status enums stay aligned', () => {
    expect(Object.values(ShiftInviteStatus)).toEqual(
      Object.values(EventInviteStatus),
    );
    expect(Object.values(ShiftInviteOrigin)).toEqual(
      Object.values(EventInviteOrigin),
    );
  });
});

describe('invite origin backfill SQL', () => {
  it('contains one UPDATE per legacy status for each invite table', () => {
    const sql = readFileSync(
      join(
        __dirname,
        '../database/migrations/20260825122356_good_steel_serpent/migration.sql',
      ),
      'utf8',
    );

    const tables = [
      'event_invites',
      'shift_instance_invites',
      'shift_invites',
    ] as const;

    for (const table of tables) {
      expect(sql).toContain(
        `UPDATE "${table}" SET "origin" = 'ADMIN_INVITED', "status" = NULL WHERE "status" = 'INVITED'`,
      );
      expect(sql).toContain(
        `UPDATE "${table}" SET "origin" = 'ADMIN_INVITED', "status" = 'VOLUNTEER_ACCEPTED' WHERE "status" = 'ACCEPTED'`,
      );
      expect(sql).toContain(
        `UPDATE "${table}" SET "origin" = 'VOLUNTEER_JOINED', "status" = NULL WHERE "status" = 'SELF_JOINED'`,
      );
      expect(sql).toContain(
        `UPDATE "${table}" SET "origin" = 'ADMIN_INVITED', "status" = 'VOLUNTEER_REJECTED' WHERE "status" = 'VOLUNTEER_REJECTED'`,
      );
      expect(sql).toContain(
        `UPDATE "${table}" SET "origin" = NULL, "status" = 'ADMIN_REJECTED' WHERE "status" = 'ADMIN_REJECTED'`,
      );
      expect(sql).toContain(
        `UPDATE "${table}" SET "origin" = NULL, "status" = 'VOLUNTEER_CANCELLED' WHERE "status" = 'CANCELLED'`,
      );
    }
  });
});
