import { Inject, Injectable, Logger } from '@nestjs/common';
import { and, eq, gt, inArray } from 'drizzle-orm';
import { AuthService } from '../../auth/auth.service';
import { PERMISSIONS } from '../../auth/constants';
import type { Database } from '../../database/database.module';
import { DATABASE_CONNECTION } from '../../database/database-connection';
import * as schema from '../../database/schema';
import { AppI18nService } from '../../i18n/app-i18n.service';
import type { EmailTemplateContext } from '../../i18n/email-translate';
import { EmailService } from '../../notification/email/email.service';
import { createEmailTemplateContext } from '../../notification/email/email-template-context';
import { shiftInstanceCallOutSummaryTemplate } from '../../notification/email/templates/shift-instance-call-out-summary.template';
import { shiftInstanceUnderstaffedReminderTemplate } from '../../notification/email/templates/shift-instance-understaffed-reminder.template';
import { NotificationService } from '../../notification/notification.service';
import { NotificationEvent } from '../../notification/notification-events';
import { OrganizationUnitDataService } from '../../organization/organization-unit-data.service';
import {
  ShiftCallOutDeliveryStatus,
  ShiftCallOutSource,
  ShiftInviteStatus,
  ShiftManagerNotificationKind,
} from '../enums';
import type { ShiftEntity } from '../schemas/shift.schema';
import type { ShiftInstanceEntity } from '../schemas/shift-instance.schema';
import type { ShiftInstanceUnderstaffedStateEntity } from '../schemas/shift-instance-understaffed-state.schema';
import { ShiftService } from '../shift.service';
import { hoursUntil } from '../utils/app-time';
import { decideUnderstaffedTick } from '../utils/understaffed-tick-decision';
import { ShiftCallOutService } from './shift-call-out.service';

const WINDOW_HOURS = 48;
const REMINDER_THRESHOLD_HOURS = 24;
const SYSTEM_ACTOR_USER_ID = 'system-automated';

type InstanceWithMaster = ShiftInstanceEntity & { master: ShiftEntity };

interface StaffingContext {
  effectiveMin: number;
  filledCount: number;
}

type UnderstaffedTrackingState = Pick<
  ShiftInstanceUnderstaffedStateEntity,
  'instanceId' | 'lastCheckedAt' | 'callOutFiredAt' | 'reminderFiredAt'
>;

@Injectable()
export class ShiftUnderstaffedNotificationService {
  private readonly logger = new Logger(
    ShiftUnderstaffedNotificationService.name,
  );

  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: Database,
    private readonly shiftService: ShiftService,
    private readonly shiftCallOutService: ShiftCallOutService,
    private readonly authService: AuthService,
    private readonly organizationUnitDataService: OrganizationUnitDataService,
    private readonly notificationService: NotificationService,
    private readonly emailService: EmailService,
    private readonly appI18n: AppI18nService,
  ) {}

  async runTick(now: Date = new Date()): Promise<void> {
    const candidates =
      await this.shiftService.findUnderstaffedCandidateInstances(
        now,
        WINDOW_HOURS,
      );
    if (candidates.length === 0) return;

    const instanceIds = candidates.map((instance) => instance.id);
    const [filledCounts, states] = await Promise.all([
      this.shiftService.getFilledCounts(instanceIds),
      this.loadStates(instanceIds),
    ]);

    for (const instance of candidates) {
      const effectiveMin =
        instance.overrideMinVolunteers ?? instance.master.minVolunteers;
      if (effectiveMin == null) continue;

      const state = states.get(instance.id) ?? {
        instanceId: instance.id,
        lastCheckedAt: null,
        callOutFiredAt: null,
        reminderFiredAt: null,
      };
      const filledCount = filledCounts.get(instance.id) ?? 0;

      try {
        await this.processInstance(instance, state, now, {
          effectiveMin,
          filledCount,
        });
      } catch (error) {
        this.logger.error(
          `Failed to process understaffed check for instance ${instance.id}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }
  }

  private async loadStates(
    instanceIds: string[],
  ): Promise<Map<string, ShiftInstanceUnderstaffedStateEntity>> {
    if (instanceIds.length === 0) return new Map();

    const rows = await this.db
      .select()
      .from(schema.shiftInstanceUnderstaffedStates)
      .where(
        inArray(schema.shiftInstanceUnderstaffedStates.instanceId, instanceIds),
      );

    return new Map(rows.map((row) => [row.instanceId, row]));
  }

  private async processInstance(
    instance: InstanceWithMaster,
    state: UnderstaffedTrackingState,
    now: Date,
    staffing: StaffingContext,
  ): Promise<void> {
    const decision = decideUnderstaffedTick({
      belowMinimum: staffing.filledCount < staffing.effectiveMin,
      hoursUntilStart: hoursUntil(instance.actualStartsAt, now),
      callOutAlreadyFired: state.callOutFiredAt != null,
      reminderAlreadyFired: state.reminderFiredAt != null,
      reminderThresholdHours: REMINDER_THRESHOLD_HOURS,
    });

    if (decision.rearm) {
      await this.upsertState(instance.id, {
        lastCheckedAt: now,
        callOutFiredAt: null,
        reminderFiredAt: state.reminderFiredAt,
      });
      return;
    }

    if (decision.fireCallOut) {
      await this.fireCallOut(instance, staffing, state.lastCheckedAt);
    }
    if (decision.fireReminder) {
      await this.fireReminder(instance, staffing);
    }

    await this.upsertState(instance.id, {
      lastCheckedAt: now,
      callOutFiredAt: decision.fireCallOut ? now : state.callOutFiredAt,
      reminderFiredAt: decision.fireReminder ? now : state.reminderFiredAt,
    });
  }

  private async upsertState(
    instanceId: string,
    values: {
      lastCheckedAt: Date;
      callOutFiredAt: Date | null;
      reminderFiredAt: Date | null;
    },
  ): Promise<void> {
    await this.db
      .insert(schema.shiftInstanceUnderstaffedStates)
      .values({ instanceId, ...values })
      .onConflictDoUpdate({
        target: schema.shiftInstanceUnderstaffedStates.instanceId,
        set: values,
      });
  }

  private async fireCallOut(
    instance: InstanceWithMaster,
    staffing: StaffingContext,
    lastCheckedAt: Date | null,
  ): Promise<void> {
    const excludeUserIds = await this.findRecentlyCancelledUserIds(
      instance,
      lastCheckedAt,
    );

    const callOutResult = await this.shiftCallOutService.sendCallOut(
      instance.id,
      instance.master.organizationUnitId,
      SYSTEM_ACTOR_USER_ID,
      { source: ShiftCallOutSource.AUTOMATIC, excludeUserIds },
    );

    await this.sendManagerEmails(
      instance,
      ShiftManagerNotificationKind.CALL_OUT_SUMMARY,
      NotificationEvent.SHIFT_INSTANCE_CALL_OUT_SUMMARY,
      (organizationUnitName, firstName, templateContext) =>
        shiftInstanceCallOutSummaryTemplate(
          {
            organizationUnitId: instance.master.organizationUnitId,
            organizationUnitName,
            shiftId: instance.masterId,
            shiftTitle: instance.overrideTitle ?? instance.master.title,
            instanceId: instance.id,
            recipientFirstName: firstName,
            startsAt: instance.actualStartsAt,
            endsAt: instance.actualEndsAt,
            filledCount: staffing.filledCount,
            minVolunteers: staffing.effectiveMin,
            callOutRecipientCount: callOutResult.recipientCount,
          },
          templateContext,
        ),
    );
  }

  private async fireReminder(
    instance: InstanceWithMaster,
    staffing: StaffingContext,
  ): Promise<void> {
    await this.sendManagerEmails(
      instance,
      ShiftManagerNotificationKind.REMINDER,
      NotificationEvent.SHIFT_INSTANCE_UNDERSTAFFED_REMINDER,
      (organizationUnitName, firstName, templateContext) =>
        shiftInstanceUnderstaffedReminderTemplate(
          {
            organizationUnitId: instance.master.organizationUnitId,
            organizationUnitName,
            shiftId: instance.masterId,
            shiftTitle: instance.overrideTitle ?? instance.master.title,
            instanceId: instance.id,
            recipientFirstName: firstName,
            startsAt: instance.actualStartsAt,
            endsAt: instance.actualEndsAt,
            filledCount: staffing.filledCount,
            minVolunteers: staffing.effectiveMin,
          },
          templateContext,
        ),
    );
  }

  private async sendManagerEmails(
    instance: InstanceWithMaster,
    kind: ShiftManagerNotificationKind,
    event: NotificationEvent,
    render: (
      organizationUnitName: string,
      firstName: string,
      templateContext: EmailTemplateContext,
    ) => Promise<{ subject: string; html: string }>,
  ): Promise<void> {
    const managers = await this.authService.findUsersWithPermission(
      instance.master.organizationUnitId,
      PERMISSIONS.SHIFT_EDIT,
    );
    if (managers.length === 0) {
      this.logger.warn(
        `No managers to notify for instance ${instance.id} (${kind})`,
      );
      return;
    }

    const organizationUnit = await this.organizationUnitDataService.findById(
      instance.master.organizationUnitId,
    );
    if (!organizationUnit) {
      this.logger.warn(
        `Organization unit ${instance.master.organizationUnitId} not found for instance ${instance.id}`,
      );
      return;
    }

    const recipients =
      await this.notificationService.resolveUsersNotificationData(
        managers.map((manager) => manager.id),
        { event },
      );
    if (recipients.length === 0) return;

    const sentAt = new Date();
    const results = await Promise.all(
      recipients.map(async (recipient) => {
        try {
          const templateContext = createEmailTemplateContext(
            this.appI18n,
            recipient.locale,
          );
          const { subject, html } = await render(
            organizationUnit.name,
            recipient.firstName,
            templateContext,
          );
          await this.emailService.send({ to: recipient.email, subject, html });
          return {
            userId: recipient.userId,
            status: ShiftCallOutDeliveryStatus.SENT,
          };
        } catch (error) {
          this.logger.error(
            `Failed to send ${kind} email to user ${recipient.userId}: ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
          return {
            userId: recipient.userId,
            status: ShiftCallOutDeliveryStatus.FAILED,
          };
        }
      }),
    );

    await this.db.insert(schema.shiftManagerNotifications).values(
      results.map((result) => ({
        instanceId: instance.id,
        recipientId: result.userId,
        kind,
        status: result.status,
        sentAt,
      })),
    );
  }

  private async findRecentlyCancelledUserIds(
    instance: InstanceWithMaster,
    since: Date | null,
  ): Promise<string[]> {
    if (!since) return [];

    const [instanceCancellations, seriesCancellations] = await Promise.all([
      this.db
        .select({ userId: schema.shiftInstanceInvites.userId })
        .from(schema.shiftInstanceInvites)
        .where(
          and(
            eq(schema.shiftInstanceInvites.instanceId, instance.id),
            eq(
              schema.shiftInstanceInvites.status,
              ShiftInviteStatus.VOLUNTEER_CANCELLED,
            ),
            gt(schema.shiftInstanceInvites.updatedAt, since),
          ),
        ),
      this.db
        .select({ userId: schema.shiftInvites.userId })
        .from(schema.shiftInvites)
        .where(
          and(
            eq(schema.shiftInvites.shiftId, instance.masterId),
            eq(
              schema.shiftInvites.status,
              ShiftInviteStatus.VOLUNTEER_CANCELLED,
            ),
            gt(schema.shiftInvites.updatedAt, since),
          ),
        ),
    ]);

    return [
      ...new Set([
        ...instanceCancellations.map((row) => row.userId),
        ...seriesCancellations.map((row) => row.userId),
      ]),
    ];
  }
}
