jest.mock('nanoid', () => ({
  customAlphabet: () => () => 'abcdefghijkl',
}));

jest.mock('../../notification/email/email-template-context', () => ({
  createEmailTemplateContext: () => ({}),
}));

jest.mock(
  '../../notification/email/templates/shift-instance-call-out.template',
  () => ({
    shiftInstanceCallOutTemplate: jest
      .fn()
      .mockResolvedValue({ subject: 'Call-out', html: '<p>join</p>' }),
  }),
);

jest.mock(
  '../../notification/email/templates/shift-instance-call-out-no-recipients.template',
  () => ({
    shiftInstanceCallOutNoRecipientsTemplate: jest
      .fn()
      .mockResolvedValue({ subject: 'Nobody left', html: '<p>none</p>' }),
  }),
);

import {
  POSTHOG_EVENT,
  POSTHOG_SURFACE,
} from '../../shared/observability/posthog.events';
import { PostHogService } from '../../shared/observability/posthog.service';
import { ShiftInviteStatus, ShiftVisibility } from '../enums';
import { ShiftCallOutService } from './shift-call-out.service';

function futureInstance() {
  return {
    id: 'si-1',
    masterId: 'shift-1',
    isCancelled: false,
    actualStartsAt: new Date(Date.now() + 3600_000),
    actualEndsAt: new Date(Date.now() + 7200_000),
    overrideTitle: null,
    overrideLocation: null,
    master: {
      id: 'shift-1',
      title: 'Evening shift',
      location: 'Hall',
      organizationUnitId: 'ou-1',
      visibility: ShiftVisibility.INVITED_MEMBERS,
    },
  };
}

describe('ShiftCallOutService.sendCallOut PostHog', () => {
  it('captures shift_call_out_send after emails go out', async () => {
    const capture = jest.fn();
    const insert = jest.fn().mockReturnValue({
      values: jest.fn().mockResolvedValue(undefined),
    });
    const db = {
      query: {
        organizationUnits: {
          findFirst: jest.fn().mockResolvedValue({
            id: 'ou-1',
            name: 'Unit',
            organizationId: 'org-1',
          }),
        },
      },
      select: jest
        .fn()
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([
              {
                userId: 'volunteer-1',
                status: ShiftInviteStatus.ADMIN_INVITED,
              },
            ]),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([]),
          }),
        }),
      insert,
    };
    const service = new ShiftCallOutService(
      db as never,
      {
        findInstanceById: jest.fn().mockResolvedValue(futureInstance()),
      } as never,
      {} as never,
      {} as never,
      {
        resolveUsersNotificationData: jest.fn().mockResolvedValue([
          {
            userId: 'volunteer-1',
            email: 'volunteer@example.com',
            firstName: 'Ada',
            locale: 'en',
          },
        ]),
      } as never,
      { send: jest.fn().mockResolvedValue(undefined) } as never,
      { t: jest.fn() } as never,
      { capture } as unknown as PostHogService,
    );

    await service.sendCallOut('si-1', 'ou-1', 'admin-1');

    expect(capture).toHaveBeenCalledWith({
      event: POSTHOG_EVENT.SHIFT_CALL_OUT_SEND,
      userId: 'admin-1',
      properties: {
        surface: POSTHOG_SURFACE.BACKOFFICE,
        organization_id: 'org-1',
        organization_unit_id: 'ou-1',
        shift_id: 'shift-1',
        shift_instance_id: 'si-1',
        recipient_count: 1,
        sent_to_manager_fallback: false,
      },
    });
  });

  it('captures with manager fallback when nobody is left to ask', async () => {
    const capture = jest.fn();
    const db = {
      query: {
        organizationUnits: {
          findFirst: jest.fn().mockResolvedValue({
            id: 'ou-1',
            name: 'Unit',
            organizationId: 'org-1',
          }),
        },
      },
      select: jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      }),
    };
    const service = new ShiftCallOutService(
      db as never,
      {
        findInstanceById: jest.fn().mockResolvedValue(futureInstance()),
      } as never,
      {} as never,
      {} as never,
      {
        resolveUserNotificationData: jest.fn().mockResolvedValue({
          userId: 'admin-1',
          email: 'admin@example.com',
          firstName: 'Ada',
          locale: 'en',
        }),
      } as never,
      { send: jest.fn().mockResolvedValue(undefined) } as never,
      { t: jest.fn() } as never,
      { capture } as unknown as PostHogService,
    );

    await service.sendCallOut('si-1', 'ou-1', 'admin-1');

    expect(capture).toHaveBeenCalledWith({
      event: POSTHOG_EVENT.SHIFT_CALL_OUT_SEND,
      userId: 'admin-1',
      properties: {
        surface: POSTHOG_SURFACE.BACKOFFICE,
        organization_id: 'org-1',
        organization_unit_id: 'ou-1',
        shift_id: 'shift-1',
        shift_instance_id: 'si-1',
        recipient_count: 0,
        sent_to_manager_fallback: true,
      },
    });
  });
});
