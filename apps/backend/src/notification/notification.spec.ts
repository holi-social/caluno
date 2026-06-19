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
import { MembershipListener } from './listeners/membership.listener';
import { OrganizationListener } from './listeners/organization.listener';
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
});
