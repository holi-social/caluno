jest.mock('nanoid', () => ({
  customAlphabet: () => () => 'abcdefghijkl',
}));

import { EventEmitterModule } from '@nestjs/event-emitter';
import { Test, type TestingModule } from '@nestjs/testing';
import { UserService } from '../user/user.service';
import { EmailService } from './email/email.service';
import { membershipApprovedTemplate } from './email/templates/membership-approved.template';
import { membershipRequestedTemplate } from './email/templates/membership-requested.template';
import { organizationCreatedTemplate } from './email/templates/organization-created.template';
import { passwordResetTemplate } from './email/templates/password-reset.template';
import { shiftInstanceJoinedTemplate } from './email/templates/shift-instance-joined.template';
import { MembershipListener } from './listeners/membership.listener';
import { OrganizationListener } from './listeners/organization.listener';
import { ShiftListener } from './listeners/shift.listener';
import { NotificationService } from './notification.service';
import { TypedNotificationEmitter } from './typed-notification-emitter.service';

describe('NotificationModule', () => {
  let moduleRef: TestingModule;
  let notificationService: NotificationService;
  let emailService: { send: jest.Mock };
  let userService: { findById: jest.Mock };
  const originalWebUrl = process.env.WEB_URL;

  beforeEach(async () => {
    process.env.WEB_URL = 'http://localhost:3000';

    emailService = {
      send: jest.fn().mockResolvedValue(undefined),
    };
    userService = {
      findById: jest.fn(),
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
        { provide: EmailService, useValue: emailService },
        { provide: UserService, useValue: userService },
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
    const expected = await organizationCreatedTemplate({
      organizationUnitId: payload.organizationUnitId,
      organizationName: payload.organizationName,
      recipientFirstName: 'Jane',
    });

    notificationService.notifyOrganizationCreated(payload);

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(userService.findById).toHaveBeenCalledWith(user.id);
    expect(emailService.send).toHaveBeenCalledWith({
      to: user.email,
      subject: expected.subject,
      html: expected.html,
    });
  });

  it('renders password reset email with reset link and expiry', async () => {
    const resetUrl = 'http://localhost:3000/reset-password?token=reset-token-1';

    const email = await passwordResetTemplate({
      resetUrl,
      expiresInMinutes: 60,
    });

    expect(email.subject).toBe('Reset your Clippy password');
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
    const expectedAlice = await membershipRequestedTemplate({
      organizationUnitId: payload.organizationUnitId,
      organizationUnitName: payload.organizationUnitName,
      requesterName: 'Sam Requester',
      recipientFirstName: 'Alice',
    });
    const expectedBob = await membershipRequestedTemplate({
      organizationUnitId: payload.organizationUnitId,
      organizationUnitName: payload.organizationUnitName,
      requesterName: 'Sam Requester',
      recipientFirstName: 'Bob',
    });

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
    const expected = await membershipApprovedTemplate({
      organizationUnitId: payload.organizationUnitId,
      organizationName: payload.organizationName,
      recipientFirstName: 'Sam',
    });

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
    const expectedAlice = await shiftInstanceJoinedTemplate({
      organizationUnitId: payload.organizationUnitId,
      organizationUnitName: payload.organizationUnitName,
      shiftTitle: payload.shiftTitle,
      volunteerName: 'Sam Volunteer',
      recipientFirstName: 'Alice',
      startsAt,
    });
    const expectedBob = await shiftInstanceJoinedTemplate({
      organizationUnitId: payload.organizationUnitId,
      organizationUnitName: payload.organizationUnitName,
      shiftTitle: payload.shiftTitle,
      volunteerName: 'Sam Volunteer',
      recipientFirstName: 'Bob',
      startsAt,
    });

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
});
