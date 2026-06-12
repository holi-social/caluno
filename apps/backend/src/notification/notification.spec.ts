import { ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { Test, type TestingModule } from '@nestjs/testing';
import { EmailService } from './email/email.service';
import { organizationCreatedTemplate } from './email/templates/organization-created.template';
import { NotificationModule } from './notification.module';
import { NotificationEvent } from './notification-events';
import { TypedNotificationEmitter } from './typed-notification-emitter.service';

describe('NotificationModule', () => {
  let moduleRef: TestingModule;
  let emitter: TypedNotificationEmitter;
  let emailService: { send: jest.Mock };

  beforeEach(async () => {
    emailService = {
      send: jest.fn().mockResolvedValue(undefined),
    };

    moduleRef = await Test.createTestingModule({
      imports: [
        EventEmitterModule.forRoot({
          wildcard: true,
          delimiter: '.',
          global: true,
        }),
        NotificationModule,
      ],
    })
      .overrideProvider(EmailService)
      .useValue(emailService)
      .compile();

    await moduleRef.init();

    emitter = moduleRef.get(TypedNotificationEmitter);
  });

  afterEach(async () => {
    await moduleRef.close();
  });

  it('sends organization created email when event is emitted', async () => {
    const payload = {
      organizationUnitId: 'unit-root-1',
      organizationName: 'Acme Volunteers',
      ownerEmail: 'owner@example.com',
      ownerFirstName: 'Jane',
    };
    const configService = moduleRef.get(ConfigService);
    const expected = await organizationCreatedTemplate(payload, {
      appUrl: configService.get<string>('WEB_URL'),
    });

    emitter.emit(NotificationEvent.ORGANIZATION_CREATED, payload);

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(emailService.send).toHaveBeenCalledWith({
      to: payload.ownerEmail,
      subject: expected.subject,
      html: expected.html,
    });
  });
});
