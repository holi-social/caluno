jest.mock('nanoid', () => ({
  customAlphabet: () => () => 'abcdefghijkl',
}));

import { EventEmitterModule } from '@nestjs/event-emitter';
import { Test, type TestingModule } from '@nestjs/testing';
import type { Locale } from '../graphql/locale';
import { AppI18nService } from '../i18n/app-i18n.service';
import type { EmailTemplateContext } from '../i18n/email-translate';
import {
  formatLocaleDate,
  formatLocaleDateTime,
  formatLocaleList,
  formatLocaleTime,
} from '../i18n/format-date-time';
import deEmail from '../i18n/locales/de/email.json';
import enEmail from '../i18n/locales/en/email.json';
import { UserLocaleService } from '../i18n/user-locale.service';
import { RecurrenceDay } from '../shift/enums';
import { UserService } from '../user/user.service';
import { EmailService } from './email/email.service';
import { eventInvitedTemplate } from './email/templates/event-invited.template';
import { membershipApprovedTemplate } from './email/templates/membership-approved.template';
import { membershipRequestedTemplate } from './email/templates/membership-requested.template';
import { organizationCreatedTemplate } from './email/templates/organization-created.template';
import { passwordResetTemplate } from './email/templates/password-reset.template';
import { shiftInstanceCancelledTemplate } from './email/templates/shift-instance-cancelled.template';
import { shiftInstanceInvitedTemplate } from './email/templates/shift-instance-invited.template';
import { shiftInstanceJoinedTemplate } from './email/templates/shift-instance-joined.template';
import { shiftInstanceSeriesCancelledTemplate } from './email/templates/shift-instance-series-cancelled.template';
import { shiftInvitedTemplate } from './email/templates/shift-invited.template';
import { EventListener } from './listeners/event.listener';
import { MembershipListener } from './listeners/membership.listener';
import { OrganizationListener } from './listeners/organization.listener';
import { ShiftListener } from './listeners/shift.listener';
import { NotificationService } from './notification.service';
import { TypedNotificationEmitter } from './typed-notification-emitter.service';

function createFixtureTranslator(locale: Locale): EmailTemplateContext {
  const messages = locale === 'de' ? deEmail : enEmail;

  const t = (key: string, args?: Record<string, string | number>) => {
    const parts = key.split('.');
    let value: unknown = messages;
    for (const part of parts) {
      value = (value as Record<string, unknown>)?.[part];
    }

    let result = typeof value === 'string' ? value : key;
    if (args) {
      for (const [argKey, argValue] of Object.entries(args)) {
        result = result.replace(`{${argKey}}`, String(argValue));
      }
    }
    return result;
  };

  return {
    t,
    formatDateTime: (date: Date) => formatLocaleDateTime(date, locale),
    formatDate: (date: Date) => formatLocaleDate(date, locale),
    formatTime: (date: Date) => formatLocaleTime(date, locale),
    formatList: (items: string[]) => formatLocaleList(items, locale),
  };
}

describe('NotificationModule', () => {
  let moduleRef: TestingModule;
  let notificationService: NotificationService;
  let emailService: { send: jest.Mock };
  let userService: { findById: jest.Mock };
  let userLocaleService: { resolveForUser: jest.Mock };
  const originalWebUrl = process.env.WEB_URL;

  beforeEach(async () => {
    process.env.WEB_URL = 'http://localhost:3000';

    emailService = {
      send: jest.fn().mockResolvedValue(undefined),
    };
    userService = {
      findById: jest.fn(),
    };
    userLocaleService = {
      resolveForUser: jest.fn().mockResolvedValue('en'),
    };

    moduleRef = await Test.createTestingModule({
      imports: [
        EventEmitterModule.forRoot({
          wildcard: true,
          delimiter: '.',
          global: true,
        }),
      ],
      providers: [
        TypedNotificationEmitter,
        NotificationService,
        OrganizationListener,
        MembershipListener,
        ShiftListener,
        EventListener,
        { provide: EmailService, useValue: emailService },
        { provide: UserService, useValue: userService },
        { provide: UserLocaleService, useValue: userLocaleService },
        {
          provide: AppI18nService,
          useValue: {
            createTranslator: (locale: Locale) => ({
              t: createFixtureTranslator(locale).t,
            }),
          },
        },
      ],
    }).compile();

    await moduleRef.init();

    notificationService = moduleRef.get(NotificationService);
  });

  afterEach(async () => {
    await moduleRef.close();
    if (originalWebUrl === undefined) {
      delete process.env.WEB_URL;
    } else {
      process.env.WEB_URL = originalWebUrl;
    }
  });

  it('sends organization created email when event is emitted', async () => {
    const user = {
      id: 'user-owner-1',
      name: 'Jane Doe',
      email: 'owner@example.com',
    };
    userService.findById.mockResolvedValue(user);

    const payload = {
      organizationUnitId: 'unit-root-1',
      organizationName: 'Acme Volunteers',
      userId: user.id,
    };
    const expected = await organizationCreatedTemplate(
      {
        organizationUnitId: payload.organizationUnitId,
        organizationName: payload.organizationName,
        recipientFirstName: 'Jane',
      },
      createFixtureTranslator('en'),
    );

    notificationService.notifyOrganizationCreated(payload);

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(userService.findById).toHaveBeenCalledWith(user.id);
    expect(userLocaleService.resolveForUser).toHaveBeenCalledWith(user.id);
    expect(emailService.send).toHaveBeenCalledWith({
      to: user.email,
      subject: expected.subject,
      html: expected.html,
    });
  });

  it('sends organization created email in German when recipient locale is de', async () => {
    const user = {
      id: 'user-owner-de',
      name: 'Jane Doe',
      email: 'owner-de@example.com',
    };
    userService.findById.mockResolvedValue(user);
    userLocaleService.resolveForUser.mockResolvedValue('de');

    const payload = {
      organizationUnitId: 'unit-root-1',
      organizationName: 'Acme Volunteers',
      userId: user.id,
    };
    const expected = await organizationCreatedTemplate(
      {
        organizationUnitId: payload.organizationUnitId,
        organizationName: payload.organizationName,
        recipientFirstName: 'Jane',
      },
      createFixtureTranslator('de'),
    );

    notificationService.notifyOrganizationCreated(payload);

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(emailService.send).toHaveBeenCalledWith({
      to: user.email,
      subject: expected.subject,
      html: expected.html,
    });
    expect(expected.subject).toContain('bereit');
  });

  it('renders password reset email with reset link and expiry', async () => {
    const resetUrl = 'http://localhost:3000/reset-password?token=reset-token-1';

    const email = await passwordResetTemplate(
      {
        resetUrl,
        expiresInMinutes: 60,
      },
      createFixtureTranslator('en'),
    );

    expect(email.subject).toBe('Reset your Caluno password');
    expect(email.html).toContain(resetUrl);
    expect(email.html).toContain('This link expires in 60 minutes.');
  });

  it('sends membership requested email to each reviewer', async () => {
    const users = new Map([
      [
        'requester-1',
        {
          id: 'requester-1',
          name: 'Sam Requester',
          email: 'requester@example.com',
        },
      ],
      [
        'reviewer-1',
        {
          id: 'reviewer-1',
          name: 'Alice Reviewer',
          email: 'alice@example.com',
        },
      ],
      [
        'reviewer-2',
        {
          id: 'reviewer-2',
          name: 'Bob Reviewer',
          email: 'bob@example.com',
        },
      ],
    ]);
    userService.findById.mockImplementation((id: string) =>
      Promise.resolve(users.get(id)),
    );

    const payload = {
      organizationUnitId: 'unit-root-1',
      organizationUnitName: 'Acme Volunteers',
      requesterUserId: 'requester-1',
      recipientUserIds: ['reviewer-1', 'reviewer-2'],
    };
    const expectedAlice = await membershipRequestedTemplate(
      {
        organizationUnitId: payload.organizationUnitId,
        organizationUnitName: payload.organizationUnitName,
        requesterName: 'Sam Requester',
        recipientFirstName: 'Alice',
      },
      createFixtureTranslator('en'),
    );
    const expectedBob = await membershipRequestedTemplate(
      {
        organizationUnitId: payload.organizationUnitId,
        organizationUnitName: payload.organizationUnitName,
        requesterName: 'Sam Requester',
        recipientFirstName: 'Bob',
      },
      createFixtureTranslator('en'),
    );

    notificationService.notifyMembershipRequested(payload);

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(userService.findById).toHaveBeenCalledWith('requester-1');
    expect(userService.findById).toHaveBeenCalledWith('reviewer-1');
    expect(userService.findById).toHaveBeenCalledWith('reviewer-2');
    expect(emailService.send).toHaveBeenCalledWith({
      to: 'alice@example.com',
      subject: expectedAlice.subject,
      html: expectedAlice.html,
    });
    expect(emailService.send).toHaveBeenCalledWith({
      to: 'bob@example.com',
      subject: expectedBob.subject,
      html: expectedBob.html,
    });
  });

  it('sends membership approved email when event is emitted', async () => {
    const user = {
      id: 'user-member-1',
      name: 'Sam Smith',
      email: 'volunteer@example.com',
    };
    userService.findById.mockResolvedValue(user);

    const payload = {
      organizationUnitId: 'unit-root-1',
      organizationName: 'Acme Volunteers',
      userId: user.id,
    };
    const expected = await membershipApprovedTemplate(
      {
        organizationUnitId: payload.organizationUnitId,
        organizationName: payload.organizationName,
        recipientFirstName: 'Sam',
      },
      createFixtureTranslator('en'),
    );

    notificationService.notifyMembershipApproved(payload);

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(userService.findById).toHaveBeenCalledWith(user.id);
    expect(emailService.send).toHaveBeenCalledWith({
      to: user.email,
      subject: expected.subject,
      html: expected.html,
    });
  });

  it('sends shift joined email to each shift manager', async () => {
    const startsAt = new Date('2026-07-01T10:00:00.000Z');
    const users = new Map([
      [
        'volunteer-1',
        {
          id: 'volunteer-1',
          name: 'Sam Volunteer',
          email: 'volunteer@example.com',
        },
      ],
      [
        'manager-1',
        {
          id: 'manager-1',
          name: 'Alice Manager',
          email: 'alice@example.com',
        },
      ],
      [
        'manager-2',
        {
          id: 'manager-2',
          name: 'Bob Manager',
          email: 'bob@example.com',
        },
      ],
    ]);
    userService.findById.mockImplementation((id: string) =>
      Promise.resolve(users.get(id)),
    );

    const payload = {
      organizationUnitId: 'unit-root-1',
      organizationUnitName: 'Acme Volunteers',
      shiftTitle: 'Morning Kitchen',
      joinedUserId: 'volunteer-1',
      recipientUserIds: ['manager-1', 'manager-2'],
      startsAt,
    };
    const expectedAlice = await shiftInstanceJoinedTemplate(
      {
        organizationUnitId: payload.organizationUnitId,
        organizationUnitName: payload.organizationUnitName,
        shiftTitle: payload.shiftTitle,
        volunteerName: 'Sam Volunteer',
        recipientFirstName: 'Alice',
        startsAt,
      },
      createFixtureTranslator('en'),
    );
    const expectedBob = await shiftInstanceJoinedTemplate(
      {
        organizationUnitId: payload.organizationUnitId,
        organizationUnitName: payload.organizationUnitName,
        shiftTitle: payload.shiftTitle,
        volunteerName: 'Sam Volunteer',
        recipientFirstName: 'Bob',
        startsAt,
      },
      createFixtureTranslator('en'),
    );

    notificationService.notifyShiftInstanceJoined(payload);

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(userService.findById).toHaveBeenCalledWith('volunteer-1');
    expect(userService.findById).toHaveBeenCalledWith('manager-1');
    expect(userService.findById).toHaveBeenCalledWith('manager-2');
    expect(emailService.send).toHaveBeenCalledWith({
      to: 'alice@example.com',
      subject: expectedAlice.subject,
      html: expectedAlice.html,
    });
    expect(emailService.send).toHaveBeenCalledWith({
      to: 'bob@example.com',
      subject: expectedBob.subject,
      html: expectedBob.html,
    });
  });

  it('sends shift instance invited emails to invited volunteers', async () => {
    const startsAt = new Date('2026-07-10T09:00:00.000Z');
    const endsAt = new Date('2026-07-10T12:00:00.000Z');

    userService.findById.mockImplementation((id: string) =>
      Promise.resolve({
        id,
        name: id === 'volunteer-1' ? 'Sam Volunteer' : 'Other User',
        email: id === 'volunteer-1' ? 'sam@example.com' : 'other@example.com',
      }),
    );

    const payload = {
      organizationUnitId: 'unit-root-1',
      organizationUnitName: 'Acme Volunteers',
      shiftId: 'shift-1',
      shiftTitle: 'Morning Kitchen',
      shiftLocation: 'Main hall',
      shiftInstructions: 'Bring gloves.\nArrive 10 min early.',
      recipientUserIds: ['volunteer-1'],
      startsAt,
      endsAt,
      instanceId: 'instance-1',
    };
    const expected = await shiftInstanceInvitedTemplate(
      {
        organizationUnitName: payload.organizationUnitName,
        shiftId: payload.shiftId,
        shiftTitle: payload.shiftTitle,
        shiftLocation: payload.shiftLocation,
        shiftInstructions: payload.shiftInstructions,
        recipientFirstName: 'Sam',
        startsAt,
        endsAt,
        instanceId: payload.instanceId,
      },
      createFixtureTranslator('en'),
    );

    notificationService.notifyShiftInstanceInvited(payload);

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(userService.findById).toHaveBeenCalledWith('volunteer-1');
    expect(emailService.send).toHaveBeenCalledWith({
      to: 'sam@example.com',
      subject: expected.subject,
      html: expected.html,
    });
    expect(expected.html).toContain('Bring gloves.<br />Arrive 10 min early.');
  });

  it('sends shift instance cancelled emails to affected volunteers', async () => {
    const startsAt = new Date('2026-07-10T09:00:00.000Z');
    const endsAt = new Date('2026-07-10T12:00:00.000Z');

    userService.findById.mockImplementation((id: string) =>
      Promise.resolve({
        id,
        name: id === 'volunteer-1' ? 'Sam Volunteer' : 'Other User',
        email: id === 'volunteer-1' ? 'sam@example.com' : 'other@example.com',
      }),
    );

    const payload = {
      organizationUnitId: 'unit-root-1',
      organizationUnitName: 'Acme Volunteers',
      shiftId: 'shift-1',
      shiftTitle: 'Morning Kitchen',
      shiftLocation: 'Main hall',
      recipientUserIds: ['volunteer-1'],
      startsAt,
      endsAt,
      instanceId: 'instance-1',
    };
    const expected = await shiftInstanceCancelledTemplate(
      {
        organizationUnitName: payload.organizationUnitName,
        shiftTitle: payload.shiftTitle,
        shiftLocation: payload.shiftLocation,
        recipientFirstName: 'Sam',
        startsAt,
        endsAt,
      },
      createFixtureTranslator('en'),
    );

    notificationService.notifyShiftInstanceCancelled(payload);

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(userService.findById).toHaveBeenCalledWith('volunteer-1');
    expect(emailService.send).toHaveBeenCalledWith({
      to: 'sam@example.com',
      subject: expected.subject,
      html: expected.html,
    });
  });

  it('sends shift instance series cancelled emails to affected volunteers', async () => {
    const fromDate = new Date('2026-07-10T00:00:00.000Z');

    userService.findById.mockImplementation((id: string) =>
      Promise.resolve({
        id,
        name: id === 'volunteer-1' ? 'Sam Volunteer' : 'Other User',
        email: id === 'volunteer-1' ? 'sam@example.com' : 'other@example.com',
      }),
    );

    const payload = {
      organizationUnitId: 'unit-root-1',
      organizationUnitName: 'Acme Volunteers',
      shiftId: 'shift-1',
      shiftTitle: 'Morning Kitchen',
      shiftLocation: 'Main hall',
      recipientUserIds: ['volunteer-1'],
      fromDate,
    };
    const expected = await shiftInstanceSeriesCancelledTemplate(
      {
        organizationUnitName: payload.organizationUnitName,
        shiftTitle: payload.shiftTitle,
        shiftLocation: payload.shiftLocation,
        recipientFirstName: 'Sam',
        fromDate,
      },
      createFixtureTranslator('en'),
    );

    notificationService.notifyShiftInstanceSeriesCancelled(payload);

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(userService.findById).toHaveBeenCalledWith('volunteer-1');
    expect(emailService.send).toHaveBeenCalledWith({
      to: 'sam@example.com',
      subject: expected.subject,
      html: expected.html,
    });
  });

  it('sends shift invited emails for all-instance invites', async () => {
    const firstOccurrenceStartsAt = new Date('2026-07-10T09:00:00.000Z');
    const firstOccurrenceEndsAt = new Date('2026-07-10T12:00:00.000Z');
    const secondOccurrenceStartsAt = new Date('2026-07-12T09:00:00.000Z');

    userService.findById.mockImplementation((id: string) =>
      Promise.resolve({
        id,
        name: 'Sam Volunteer',
        email: 'sam@example.com',
      }),
    );

    const schedule = {
      isRecurring: true,
      occurrenceCount: 2,
      recurrenceDays: [RecurrenceDay.MONDAY, RecurrenceDay.WEDNESDAY],
      recurrenceEndDate: new Date('2026-08-31T00:00:00.000Z'),
      firstOccurrenceStartsAt,
      firstOccurrenceEndsAt,
      lastOccurrenceStartsAt: secondOccurrenceStartsAt,
    };

    const payload = {
      organizationUnitId: 'unit-root-1',
      organizationUnitName: 'Acme Volunteers',
      shiftId: 'shift-1',
      shiftTitle: 'Morning Kitchen',
      shiftLocation: 'Main hall',
      shiftInstructions: 'Check in at reception.',
      recipientUserIds: ['volunteer-1'],
      schedule,
    };
    const expected = await shiftInvitedTemplate(
      {
        organizationUnitName: payload.organizationUnitName,
        shiftId: payload.shiftId,
        shiftTitle: payload.shiftTitle,
        shiftLocation: payload.shiftLocation,
        shiftInstructions: payload.shiftInstructions,
        recipientFirstName: 'Sam',
        schedule,
      },
      createFixtureTranslator('en'),
    );

    notificationService.notifyShiftInvited(payload);

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(userService.findById).toHaveBeenCalledWith('volunteer-1');
    expect(emailService.send).toHaveBeenCalledWith({
      to: 'sam@example.com',
      subject: expected.subject,
      html: expected.html,
    });
  });

  it('sends event invited emails to invited members', async () => {
    const startsAt = new Date('2026-09-01T09:00:00.000Z');
    const endsAt = new Date('2026-09-01T17:00:00.000Z');

    userService.findById.mockImplementation((id: string) =>
      Promise.resolve({
        id,
        name: id === 'volunteer-1' ? 'Sam Volunteer' : 'Other User',
        email: id === 'volunteer-1' ? 'sam@example.com' : 'other@example.com',
      }),
    );

    const payload = {
      organizationUnitId: 'unit-root-1',
      organizationUnitName: 'Acme Volunteers',
      eventId: 'event-1',
      eventTitle: 'Community Fair',
      eventLocation: 'Main hall',
      recipientUserIds: ['volunteer-1'],
      startsAt,
      endsAt,
    };
    const expected = await eventInvitedTemplate(
      {
        eventId: payload.eventId,
        organizationUnitName: payload.organizationUnitName,
        eventTitle: payload.eventTitle,
        eventLocation: payload.eventLocation,
        recipientFirstName: 'Sam',
        startsAt,
        endsAt,
      },
      createFixtureTranslator('en'),
    );

    notificationService.notifyEventInvited(payload);

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(userService.findById).toHaveBeenCalledWith('volunteer-1');
    expect(emailService.send).toHaveBeenCalledWith({
      to: 'sam@example.com',
      subject: expected.subject,
      html: expected.html,
    });
  });
});
