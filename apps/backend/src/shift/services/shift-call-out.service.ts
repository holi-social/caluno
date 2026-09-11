import { Inject, Injectable, Logger } from '@nestjs/common';
import { eq, inArray } from 'drizzle-orm';
import { AuthService } from '../../auth/auth.service';
import { PERMISSIONS } from '../../auth/constants';
import type { Database } from '../../database/database.module';
import { DATABASE_CONNECTION } from '../../database/database-connection';
import * as schema from '../../database/schema';
import { ConflictGraphQLError } from '../../graphql/errors';
import { AppI18nService } from '../../i18n/app-i18n.service';
import { MembershipService } from '../../membership/membership.service';
import { EmailService } from '../../notification/email/email.service';
import { createEmailTemplateContext } from '../../notification/email/email-template-context';
import { shiftInstanceCallOutTemplate } from '../../notification/email/templates/shift-instance-call-out.template';
import { shiftInstanceCallOutNoRecipientsTemplate } from '../../notification/email/templates/shift-instance-call-out-no-recipients.template';
import { NotificationService } from '../../notification/notification.service';
import { NotificationEvent } from '../../notification/notification-events';
import {
  POSTHOG_EVENT,
  POSTHOG_SURFACE,
} from '../../shared/observability/posthog.events';
import { PostHogService } from '../../shared/observability/posthog.service';
import {
  ShiftCallOutDeliveryStatus,
  ShiftCallOutSource,
  ShiftInviteStatus,
  ShiftVisibility,
} from '../enums';
import type { ShiftEntity } from '../schemas/shift.schema';
import type { ShiftInstanceEntity } from '../schemas/shift-instance.schema';
import { ShiftService } from '../shift.service';

export interface ShiftCallOutResult {
  recipientCount: number;
  sentToManagerFallback: boolean;
}

export interface SendCallOutOptions {
  /** MANUAL (default) for the admin-triggered send path; AUTOMATIC for the understaffed-shift scheduler. */
  source?: ShiftCallOutSource;
  /** User ids to exclude from this specific send even if otherwise eligible (e.g. someone who just cancelled). */
  excludeUserIds?: string[];
}

export interface ShiftCallOutSummary {
  sentAt: Date;
  recipientCount: number;
  sentById: string;
  source: ShiftCallOutSource;
}

type ShiftInstanceWithMaster = ShiftInstanceEntity & { master: ShiftEntity };

@Injectable()
export class ShiftCallOutService {
  private readonly logger = new Logger(ShiftCallOutService.name);

  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: Database,
    private readonly shiftService: ShiftService,
    private readonly authService: AuthService,
    private readonly membershipService: MembershipService,
    private readonly notificationService: NotificationService,
    private readonly emailService: EmailService,
    private readonly appI18n: AppI18nService,
    private readonly postHogService: PostHogService,
  ) {}

  async sendCallOut(
    instanceId: string,
    organizationUnitId: string,
    actorUserId: string,
    options: SendCallOutOptions = {},
  ): Promise<ShiftCallOutResult> {
    const { source = ShiftCallOutSource.MANUAL, excludeUserIds = [] } = options;
    const instance = await this.shiftService.findInstanceById(
      instanceId,
      organizationUnitId,
    );

    if (instance.isCancelled) {
      throw new ConflictGraphQLError(
        'Cannot send a call-out for a cancelled shift instance',
      );
    }
    if (instance.actualEndsAt.getTime() < Date.now()) {
      throw new ConflictGraphQLError(
        'Cannot send a call-out for a past shift instance',
      );
    }

    const [recipientUserIds, organizationUnit] = await Promise.all([
      this.resolveRecipients(instance, excludeUserIds),
      this.findOrganizationUnit(instance.master.organizationUnitId),
    ]);

    if (!organizationUnit) {
      return { recipientCount: 0, sentToManagerFallback: false };
    }

    if (recipientUserIds.length === 0) {
      const sentFallback = await this.sendNoRecipientsFallback(
        instance,
        organizationUnit,
        actorUserId,
      );
      if (sentFallback) {
        this.captureCallOutSend({
          actorUserId,
          organizationUnit,
          instance,
          recipientCount: 0,
          sentToManagerFallback: true,
        });
      }
      return { recipientCount: 0, sentToManagerFallback: true };
    }

    await this.sendCallOutEmails(
      instance,
      organizationUnit,
      recipientUserIds,
      actorUserId,
      source,
    );

    this.captureCallOutSend({
      actorUserId,
      organizationUnit,
      instance,
      recipientCount: recipientUserIds.length,
      sentToManagerFallback: false,
    });

    return {
      recipientCount: recipientUserIds.length,
      sentToManagerFallback: false,
    };
  }

  async getCallOutHistory(
    instanceIds: string[],
  ): Promise<Map<string, ShiftCallOutSummary[]>> {
    if (instanceIds.length === 0) return new Map();

    const rows = await this.db
      .select({
        instanceId: schema.shiftCallOutRecipients.instanceId,
        sentAt: schema.shiftCallOutRecipients.sentAt,
        sentById: schema.shiftCallOutRecipients.sentById,
        source: schema.shiftCallOutRecipients.source,
      })
      .from(schema.shiftCallOutRecipients)
      .where(inArray(schema.shiftCallOutRecipients.instanceId, instanceIds));

    const byInstance = new Map<string, ShiftCallOutSummary[]>(
      instanceIds.map((id) => [id, []]),
    );
    for (const row of rows) {
      const batches = byInstance.get(row.instanceId);
      if (!batches) continue;
      const existing = batches.find(
        (batch) => batch.sentAt.getTime() === row.sentAt.getTime(),
      );
      if (existing) {
        existing.recipientCount += 1;
        continue;
      }
      batches.push({
        sentAt: row.sentAt,
        recipientCount: 1,
        source: row.source,
        sentById: row.sentById,
      });
    }

    for (const batches of byInstance.values()) {
      batches.sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime());
    }

    return byInstance;
  }

  async getLastCallOutSummaries(
    instanceIds: string[],
  ): Promise<Map<string, ShiftCallOutSummary>> {
    const history = await this.getCallOutHistory(instanceIds);
    return new Map(
      [...history.entries()].map(([instanceId, batches]) => [
        instanceId,
        batches[0],
      ]),
    );
  }

  /**
   * Resolves each user's invite status for this shift: the instance-level
   * invite takes precedence, falling back to the series-level invite when
   * this occurrence has no invite record of its own.
   */
  private async resolveInviteStatuses(
    instance: ShiftInstanceWithMaster,
  ): Promise<Map<string, ShiftInviteStatus>> {
    const [instanceInvites, seriesInvites] = await Promise.all([
      this.db
        .select({
          userId: schema.shiftInstanceInvites.userId,
          status: schema.shiftInstanceInvites.status,
        })
        .from(schema.shiftInstanceInvites)
        .where(eq(schema.shiftInstanceInvites.instanceId, instance.id)),
      this.db
        .select({
          userId: schema.shiftInvites.userId,
          status: schema.shiftInvites.status,
        })
        .from(schema.shiftInvites)
        .where(eq(schema.shiftInvites.shiftId, instance.masterId)),
    ]);

    const resolved = new Map<string, ShiftInviteStatus>();
    for (const row of seriesInvites) {
      resolved.set(row.userId, row.status as ShiftInviteStatus);
    }
    for (const row of instanceInvites) {
      resolved.set(row.userId, row.status as ShiftInviteStatus);
    }

    return resolved;
  }

  private async resolveRecipients(
    instance: ShiftInstanceWithMaster,
    excludeUserIds: string[] = [],
  ): Promise<string[]> {
    const resolvedStatuses = await this.resolveInviteStatuses(instance);
    const excluded = new Set(excludeUserIds);

    if (instance.master.visibility === ShiftVisibility.INVITED_MEMBERS) {
      // ADMIN_INVITED = the ball is in the volunteer's court (unanswered).
      // AWAITING_ADMIN_APPROVAL means they already responded and it's the
      // admin who owes an action, so it's deliberately excluded here.
      return [...resolvedStatuses.entries()]
        .filter(
          ([userId, status]) =>
            status === ShiftInviteStatus.ADMIN_INVITED && !excluded.has(userId),
        )
        .map(([userId]) => userId);
    }

    const [members, managers] = await Promise.all([
      this.membershipService.getMembers(instance.master.organizationUnitId),
      this.authService.findUsersWithPermission(
        instance.master.organizationUnitId,
        PERMISSIONS.SHIFT_EDIT,
      ),
    ]);
    const managerIds = new Set(managers.map((manager) => manager.id));

    // Anyone with an existing invite record was already asked directly, or
    // already took action themselves (joined, waitlisted, or awaiting admin
    // approval) — skip them, except VOLUNTEER_CANCELLED: they backed out
    // after joining, which isn't a refusal to help, so they're still
    // eligible to be re-asked (unless explicitly excluded, e.g. by the
    // automatic scheduler for whoever just cancelled).
    return members
      .map((member) => member.id)
      .filter((userId) => {
        if (managerIds.has(userId)) return false;
        if (excluded.has(userId)) return false;
        const status = resolvedStatuses.get(userId);
        return (
          status === undefined ||
          status === ShiftInviteStatus.VOLUNTEER_CANCELLED
        );
      });
  }

  private async findOrganizationUnit(organizationUnitId: string): Promise<{
    id: string;
    name: string;
    organizationId: string | null;
  } | null> {
    const organizationUnit = await this.db.query.organizationUnits.findFirst({
      where: { id: organizationUnitId },
      columns: { id: true, name: true, organizationId: true },
    });

    return organizationUnit ?? null;
  }

  private async sendCallOutEmails(
    instance: ShiftInstanceWithMaster,
    organizationUnit: {
      id: string;
      name: string;
      organizationId?: string | null;
    },
    recipientUserIds: string[],
    actorUserId: string,
    source: ShiftCallOutSource,
  ): Promise<void> {
    const recipients =
      await this.notificationService.resolveUsersNotificationData(
        recipientUserIds,
        { event: NotificationEvent.SHIFT_INSTANCE_CALL_OUT },
      );

    const sentAt = new Date();
    const shiftTitle = instance.overrideTitle ?? instance.master.title;
    const shiftLocation = instance.overrideLocation ?? instance.master.location;

    const results = await Promise.all(
      recipients.map(async (recipient) => {
        try {
          const templateContext = createEmailTemplateContext(
            this.appI18n,
            recipient.locale,
          );
          const { subject, html } = await shiftInstanceCallOutTemplate(
            {
              organizationUnitName: organizationUnit.name,
              shiftId: instance.masterId,
              shiftTitle,
              shiftLocation,
              recipientFirstName: recipient.firstName,
              startsAt: instance.actualStartsAt,
              endsAt: instance.actualEndsAt,
              instanceId: instance.id,
            },
            templateContext,
          );
          await this.emailService.send({ to: recipient.email, subject, html });
          return {
            userId: recipient.userId,
            status: ShiftCallOutDeliveryStatus.SENT,
          };
        } catch (error) {
          this.logger.error(
            `Failed to send call-out email to user ${recipient.userId}: ${
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

    if (results.length === 0) {
      return;
    }

    await this.db.insert(schema.shiftCallOutRecipients).values(
      results.map((result) => ({
        instanceId: instance.id,
        recipientId: result.userId,
        sentById: actorUserId,
        status: result.status,
        source,
        sentAt,
      })),
    );
  }

  private captureCallOutSend(input: {
    actorUserId: string;
    organizationUnit: { id: string; organizationId?: string | null };
    instance: ShiftInstanceWithMaster;
    recipientCount: number;
    sentToManagerFallback: boolean;
  }): void {
    this.postHogService.capture({
      event: POSTHOG_EVENT.SHIFT_CALL_OUT_SEND,
      userId: input.actorUserId,
      properties: {
        surface: POSTHOG_SURFACE.BACKOFFICE,
        organization_id: input.organizationUnit.organizationId ?? undefined,
        organization_unit_id: input.organizationUnit.id,
        shift_id: input.instance.masterId,
        shift_instance_id: input.instance.id,
        recipient_count: input.recipientCount,
        sent_to_manager_fallback: input.sentToManagerFallback,
      },
    });
  }

  private async sendNoRecipientsFallback(
    instance: ShiftInstanceWithMaster,
    organizationUnit: {
      id: string;
      name: string;
      organizationId?: string | null;
    },
    actorUserId: string,
  ): Promise<boolean> {
    const manager = await this.notificationService.resolveUserNotificationData(
      actorUserId,
      { event: NotificationEvent.SHIFT_INSTANCE_CALL_OUT_NO_RECIPIENTS },
    );
    if (!manager) {
      return false;
    }

    const shiftTitle = instance.overrideTitle ?? instance.master.title;

    try {
      const templateContext = createEmailTemplateContext(
        this.appI18n,
        manager.locale,
      );
      const { subject, html } = await shiftInstanceCallOutNoRecipientsTemplate(
        {
          organizationUnitId: organizationUnit.id,
          organizationUnitName: organizationUnit.name,
          shiftTitle,
          recipientFirstName: manager.firstName,
          startsAt: instance.actualStartsAt,
          endsAt: instance.actualEndsAt,
        },
        templateContext,
      );
      await this.emailService.send({ to: manager.email, subject, html });
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send "nobody left to ask" email to user ${actorUserId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return false;
    }
  }
}
