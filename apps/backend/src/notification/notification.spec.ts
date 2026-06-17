jest.mock('nanoid', () => ({
  customAlphabet: () => () => 'abcdefghijkl',
}));

import { EventEmitterModule } from '@nestjs/event-emitter';
import { Test, type TestingModule } from '@nestjs/testing';
import { UserService } from '../user/user.service';
import { EmailService } from './email/email.service';
import { membershipApprovedTemplate } from './email/templates/membership-approved.template';
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
      name: 'Jane Doe',
      email: 'owner@example.com',
    };
    userService.findById.mockResolvedValue(user);

    const payload = {
      organizationUnitId: 'unit-root-1',
      organizationName: 'Acme Volunteers',
      userId: 'user-owner-1',
    };
    const expected = await organizationCreatedTemplate({
      organizationUnitId: payload.organizationUnitId,
      organizationName: payload.organizationName,
      recipientFirstName: 'Jane',
    });

    notificationService.notifyOrganizationCreated(payload);

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(userService.findById).toHaveBeenCalledWith(payload.userId);
    expect(emailService.send).toHaveBeenCalledWith({
      to: user.email,
      subject: expected.subject,
      html: expected.html,
    });
  });

  it('sends membership approved email when event is emitted', async () => {
    const user = {
      name: 'Sam Smith',
      email: 'volunteer@example.com',
    };
    userService.findById.mockResolvedValue(user);

    const payload = {
      organizationUnitId: 'unit-root-1',
      organizationName: 'Acme Volunteers',
      userId: 'user-member-1',
    };
    const expected = await membershipApprovedTemplate({
      organizationUnitId: payload.organizationUnitId,
      organizationName: payload.organizationName,
      recipientFirstName: 'Sam',
    });

    notificationService.notifyMembershipApproved(payload);

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(userService.findById).toHaveBeenCalledWith(payload.userId);
    expect(emailService.send).toHaveBeenCalledWith({
      to: user.email,
      subject: expected.subject,
      html: expected.html,
    });
  });
});
