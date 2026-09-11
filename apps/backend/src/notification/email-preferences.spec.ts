import { describe, expect, it } from 'bun:test';
import {
  EMAIL_PREFERENCE_FLAG,
  isSubscribedToGroup,
  NOTIFICATION_EMAIL_GROUP,
} from './email-preferences';
import { NotificationEvent } from './notification-events';

const allEvents = Object.values(NotificationEvent) as NotificationEvent[];

describe('notification email groups', () => {
  it('classifies every notification event', () => {
    for (const event of allEvents) {
      expect(Object.hasOwn(NOTIFICATION_EMAIL_GROUP, event)).toBe(true);
    }
  });

  it('maps each group to its own users column', () => {
    expect(EMAIL_PREFERENCE_FLAG).toEqual({
      weeklyUpdate: 'emailWeeklyUpdateEnabled',
      urgentCalls: 'emailUrgentCallsEnabled',
      platform: 'emailPlatformEnabled',
    });
  });

  it('gates the volunteer-facing invitations under platform', () => {
    for (const event of [
      NotificationEvent.SHIFT_INVITED,
      NotificationEvent.SHIFT_INSTANCE_INVITED,
      NotificationEvent.EVENT_INVITED,
      NotificationEvent.ORGANIZATION_UNIT_INVITED,
    ]) {
      expect(NOTIFICATION_EMAIL_GROUP[event]).toBe('platform');
    }
  });

  it('gates cancellations, shift changes, membership and removals under platform', () => {
    for (const event of [
      NotificationEvent.SHIFT_INSTANCE_CANCELLED,
      NotificationEvent.SHIFT_INSTANCE_SERIES_CANCELLED,
      NotificationEvent.EVENT_CANCELLED,
      NotificationEvent.SHIFT_DETAILS_CHANGED,
      NotificationEvent.EVENT_DETAILS_CHANGED,
      NotificationEvent.MEMBERSHIP_APPROVED,
      NotificationEvent.MEMBERSHIP_REJECTED,
      NotificationEvent.MEMBERSHIP_REMOVED,
      NotificationEvent.SHIFT_INSTANCE_REMOVED,
      NotificationEvent.SHIFT_SERIES_REMOVED,
      NotificationEvent.EVENT_REMOVED,
    ]) {
      expect(NOTIFICATION_EMAIL_GROUP[event]).toBe('platform');
    }
  });

  it('leaves manager-facing email ungated', () => {
    for (const event of [
      NotificationEvent.SHIFT_INSTANCE_JOINED,
      NotificationEvent.EVENT_JOINED,
      NotificationEvent.SHIFT_INSTANCE_VOLUNTEER_LEFT,
      NotificationEvent.SHIFT_SERIES_VOLUNTEER_LEFT,
      NotificationEvent.MEMBERSHIP_REQUESTED,
      NotificationEvent.MEMBERSHIP_LEFT,
      NotificationEvent.ORGANIZATION_CREATED,
    ]) {
      expect(NOTIFICATION_EMAIL_GROUP[event]).toBeNull();
    }
  });

  it('leaves document emails ungated (not part of the Platform toggle)', () => {
    for (const event of [
      NotificationEvent.DOCUMENT_AWAITING_SIGNATURE,
      NotificationEvent.DOCUMENT_DECLINED_BY_ORG,
      NotificationEvent.DOCUMENT_DECLINED_BY_VOLUNTEER,
    ]) {
      expect(NOTIFICATION_EMAIL_GROUP[event]).toBeNull();
    }
  });

  it('gates the urgent call-out and the weekly digest, but not their manager mails', () => {
    expect(
      NOTIFICATION_EMAIL_GROUP[NotificationEvent.SHIFT_INSTANCE_CALL_OUT],
    ).toBe('urgentCalls');
    expect(
      NOTIFICATION_EMAIL_GROUP[NotificationEvent.VOLUNTEER_DIGEST_SENT],
    ).toBe('weeklyUpdate');
    expect(
      NOTIFICATION_EMAIL_GROUP[
        NotificationEvent.SHIFT_INSTANCE_CALL_OUT_SUMMARY
      ],
    ).toBeNull();
    expect(
      NOTIFICATION_EMAIL_GROUP[
        NotificationEvent.SHIFT_INSTANCE_CALL_OUT_NO_RECIPIENTS
      ],
    ).toBeNull();
    expect(
      NOTIFICATION_EMAIL_GROUP[
        NotificationEvent.SHIFT_INSTANCE_UNDERSTAFFED_REMINDER
      ],
    ).toBeNull();
  });
});

describe('isSubscribedToGroup', () => {
  it('treats a missing flag as subscribed, so the settings default to on', () => {
    expect(isSubscribedToGroup({}, 'weeklyUpdate')).toBe(true);
    expect(
      isSubscribedToGroup({ emailPlatformEnabled: null }, 'platform'),
    ).toBe(true);
  });

  it('opts out only on an explicit false', () => {
    expect(
      isSubscribedToGroup({ emailWeeklyUpdateEnabled: false }, 'weeklyUpdate'),
    ).toBe(false);
  });

  it('reads the flag belonging to the group it is asked about', () => {
    const optedOutOfPlatform = {
      emailWeeklyUpdateEnabled: true,
      emailUrgentCallsEnabled: true,
      emailPlatformEnabled: false,
    };

    expect(isSubscribedToGroup(optedOutOfPlatform, 'platform')).toBe(false);
    expect(isSubscribedToGroup(optedOutOfPlatform, 'weeklyUpdate')).toBe(true);
    expect(isSubscribedToGroup(optedOutOfPlatform, 'urgentCalls')).toBe(true);
  });
});
