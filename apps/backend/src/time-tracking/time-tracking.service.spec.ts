jest.mock('nanoid', () => ({
  customAlphabet: () => () => 'abcdefghijkl',
}));

import {
  POSTHOG_EVENT,
  POSTHOG_SURFACE,
} from '../shared/observability/posthog.events';
import { PostHogService } from '../shared/observability/posthog.service';
import { AddTimeEntryInput } from './inputs/add-time-entry.input';
import { TimeTrackingService } from './time-tracking.service';

describe('TimeTrackingService.addTimeEntry PostHog', () => {
  it('captures with the volunteer as subject, not the admin actor', async () => {
    const capture = jest.fn();
    const db = {
      query: {
        shiftInstances: {
          findFirst: jest.fn().mockResolvedValue({
            id: 'si-1',
            master: { organizationUnitId: 'ou-1' },
          }),
        },
      },
      insert: jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([
            {
              id: 'te-1',
              shiftInstanceId: 'si-1',
              volunteerId: 'volunteer-1',
            },
          ]),
        }),
      }),
    };
    const service = new TimeTrackingService(
      db as never,
      {} as never,
      {} as never,
      { capture } as unknown as PostHogService,
      {} as never,
      {} as never,
      {} as never,
    );
    const input = Object.assign(new AddTimeEntryInput(), {
      shiftInstanceId: 'si-1',
      volunteerId: 'volunteer-1',
      startedAt: new Date(),
      notes: null,
    });

    await service.addTimeEntry('ou-1', input, 'admin-1');

    expect(capture).toHaveBeenCalledWith({
      event: POSTHOG_EVENT.TIME_ENTRY_CREATE,
      userId: 'volunteer-1',
      properties: {
        surface: POSTHOG_SURFACE.BACKOFFICE,
        organization_unit_id: 'ou-1',
        shift_instance_id: 'si-1',
      },
    });
  });
});

describe('TimeTrackingService.addTimeEntry reimbursement type', () => {
  it('inherits the instance override over the master shift type', async () => {
    const insertValues = jest.fn().mockReturnValue({
      returning: jest.fn().mockResolvedValue([
        {
          id: 'te-1',
          shiftInstanceId: 'si-1',
          volunteerId: 'volunteer-1',
          reimbursementTypeId: 'override-type',
        },
      ]),
    });
    const db = {
      query: {
        shiftInstances: {
          findFirst: jest.fn().mockResolvedValue({
            id: 'si-1',
            overrideReimbursementTypeId: 'override-type',
            master: {
              organizationUnitId: 'ou-1',
              reimbursementTypeId: 'master-type',
            },
          }),
        },
      },
      insert: jest.fn().mockReturnValue({ values: insertValues }),
    };
    const service = new TimeTrackingService(
      db as never,
      {} as never,
      {} as never,
      { capture: jest.fn() } as unknown as PostHogService,
    );
    const input = Object.assign(new AddTimeEntryInput(), {
      shiftInstanceId: 'si-1',
      volunteerId: 'volunteer-1',
      startedAt: new Date(),
      notes: null,
    });

    await service.addTimeEntry('ou-1', input, 'admin-1');

    expect(insertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        reimbursementTypeId: 'override-type',
      }),
    );
    expect(insertValues.mock.calls[0][0]).not.toHaveProperty('isPaid');
  });

  it('falls back to the master shift type when the instance has no override', async () => {
    const insertValues = jest.fn().mockReturnValue({
      returning: jest
        .fn()
        .mockResolvedValue([
          { id: 'te-2', shiftInstanceId: 'si-2', volunteerId: 'volunteer-1' },
        ]),
    });
    const db = {
      query: {
        shiftInstances: {
          findFirst: jest.fn().mockResolvedValue({
            id: 'si-2',
            overrideReimbursementTypeId: null,
            master: {
              organizationUnitId: 'ou-1',
              reimbursementTypeId: 'master-type',
            },
          }),
        },
      },
      insert: jest.fn().mockReturnValue({ values: insertValues }),
    };
    const service = new TimeTrackingService(
      db as never,
      {} as never,
      {} as never,
      { capture: jest.fn() } as unknown as PostHogService,
    );
    const input = Object.assign(new AddTimeEntryInput(), {
      shiftInstanceId: 'si-2',
      volunteerId: 'volunteer-1',
      startedAt: new Date(),
      notes: null,
    });

    await service.addTimeEntry('ou-1', input, 'admin-1');

    expect(insertValues).toHaveBeenCalledWith(
      expect.objectContaining({ reimbursementTypeId: 'master-type' }),
    );
    expect(insertValues.mock.calls[0][0]).not.toHaveProperty('isPaid');
  });

  it('stays type-less for a shift with no reimbursement type', async () => {
    const insertValues = jest.fn().mockReturnValue({
      returning: jest
        .fn()
        .mockResolvedValue([
          { id: 'te-3', shiftInstanceId: 'si-3', volunteerId: 'volunteer-1' },
        ]),
    });
    const db = {
      query: {
        shiftInstances: {
          findFirst: jest.fn().mockResolvedValue({
            id: 'si-3',
            overrideReimbursementTypeId: null,
            master: { organizationUnitId: 'ou-1', reimbursementTypeId: null },
          }),
        },
      },
      insert: jest.fn().mockReturnValue({ values: insertValues }),
    };
    const service = new TimeTrackingService(
      db as never,
      {} as never,
      {} as never,
      { capture: jest.fn() } as unknown as PostHogService,
    );
    const input = Object.assign(new AddTimeEntryInput(), {
      shiftInstanceId: 'si-3',
      volunteerId: 'volunteer-1',
      startedAt: new Date(),
      notes: null,
    });

    await service.addTimeEntry('ou-1', input, 'admin-1');

    expect(insertValues).toHaveBeenCalledWith(
      expect.objectContaining({ reimbursementTypeId: null }),
    );
    expect(insertValues.mock.calls[0][0]).not.toHaveProperty('isPaid');
  });

  it('stays type-less for a shiftless entry (no shiftInstanceId)', async () => {
    const insertValues = jest.fn().mockReturnValue({
      returning: jest
        .fn()
        .mockResolvedValue([
          { id: 'te-4', shiftInstanceId: null, volunteerId: 'volunteer-1' },
        ]),
    });
    const db = {
      query: { shiftInstances: { findFirst: jest.fn() } },
      insert: jest.fn().mockReturnValue({ values: insertValues }),
    };
    const service = new TimeTrackingService(
      db as never,
      {} as never,
      {} as never,
      { capture: jest.fn() } as unknown as PostHogService,
    );
    const input = Object.assign(new AddTimeEntryInput(), {
      shiftInstanceId: null,
      volunteerId: 'volunteer-1',
      startedAt: new Date(),
      notes: null,
    });

    await service.addTimeEntry('ou-1', input, 'admin-1');

    expect(db.query.shiftInstances.findFirst).not.toHaveBeenCalled();
    expect(insertValues).toHaveBeenCalledWith(
      expect.objectContaining({ reimbursementTypeId: null }),
    );
    expect(insertValues.mock.calls[0][0]).not.toHaveProperty('isPaid');
  });
});
