import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Database } from '../../database/database.module';
import { DATABASE_CONNECTION } from '../../database/database-connection';
import * as schema from '../../database/schema';
import { AppI18nService } from '../../i18n/app-i18n.service';
import { EmailService } from '../../notification/email/email.service';
import { createEmailTemplateContext } from '../../notification/email/email-template-context';
import {
  type NeedsVolunteersGroup,
  type NeedsVolunteersRow,
  type VolunteerDigestShiftRow,
  volunteerDigestTemplate,
} from '../../notification/email/templates/volunteer-digest.template';
import { NotificationService } from '../../notification/notification.service';
import { NotificationEvent } from '../../notification/notification-events';
import { OrganizationService } from '../../organization/organization.service';
import type { OrganizationUnitEntity } from '../../organization/schemas/organization-unit.schema';
import { ACTIVE_SHIFT_INVITE_STATUSES } from '../../shared/invite-status';
import { ShiftInviteStatus, SortOrder } from '../enums';
import type { ShiftEntity } from '../schemas/shift.schema';
import type { ShiftInstanceEntity } from '../schemas/shift-instance.schema';
import { ShiftService } from '../shift.service';
import { hoursUntil } from '../utils/app-time';
import {
  type NeedsVolunteersCandidate,
  rankShiftsNeedingVolunteers,
} from '../utils/volunteer-digest-ranking';

const UPCOMING_WINDOW_DAYS = 7;
const NEEDS_VOLUNTEERS_MIN_HOURS_OUT = 48;
const NEEDS_VOLUNTEERS_MAX_DAYS_OUT = 35;
const ROW_LIMIT = 10;
// Safety bound on how many needs-volunteers candidates are pulled per user
// before ranking/capping happens in application code. A user legitimately
// exceeding this across all their organisations combined is not expected in
// practice.
const NEEDS_VOLUNTEERS_CANDIDATE_FETCH_LIMIT = 1000;

type InstanceWithMaster = ShiftInstanceEntity & { master: ShiftEntity };

@Injectable()
export class VolunteerDigestService {
  private readonly logger = new Logger(VolunteerDigestService.name);

  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: Database,
    private readonly shiftService: ShiftService,
    private readonly organizationService: OrganizationService,
    private readonly notificationService: NotificationService,
    private readonly emailService: EmailService,
    private readonly appI18n: AppI18nService,
  ) {}

  /** Builds and sends the Sunday digest to every user with at least one organisation membership. */
  async sendDigests(sendAt: Date = new Date()): Promise<void> {
    const userIds = await this.findDigestRecipientIds();

    for (const userId of userIds) {
      try {
        await this.sendDigestForUser(userId, sendAt);
      } catch (error) {
        this.logger.error(
          `Failed to build/send volunteer digest for user ${userId}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }
  }

  private async findDigestRecipientIds(): Promise<string[]> {
    const rows = await this.db
      .selectDistinct({ userId: schema.memberships.userId })
      .from(schema.memberships);

    return rows
      .map((row) => row.userId)
      .filter((id): id is string => id != null);
  }

  private async sendDigestForUser(userId: string, sendAt: Date): Promise<void> {
    const orgUnits = await this.organizationService.findUnits(userId);
    if (orgUnits.length === 0) return;

    const upcomingWindowEndsAt = addDays(sendAt, UPCOMING_WINDOW_DAYS);
    const needsVolunteersStartsAfter = addHours(
      sendAt,
      NEEDS_VOLUNTEERS_MIN_HOURS_OUT,
    );
    const needsVolunteersEndsBefore = addDays(
      sendAt,
      NEEDS_VOLUNTEERS_MAX_DAYS_OUT,
    );

    const [myShiftsPage, pendingInvitesPage, needsVolunteersPage] =
      await Promise.all([
        this.shiftService.findMyShiftInstances(
          userId,
          false,
          sendAt,
          upcomingWindowEndsAt,
          ROW_LIMIT,
          0,
          SortOrder.ASC,
          [ShiftInviteStatus.JOINED],
        ),
        this.shiftService.findMyShiftInstances(
          userId,
          false,
          sendAt,
          upcomingWindowEndsAt,
          ROW_LIMIT,
          0,
          SortOrder.ASC,
          [ShiftInviteStatus.ADMIN_INVITED],
        ),
        this.shiftService.findAvailableShiftInstances(
          userId,
          needsVolunteersStartsAfter,
          needsVolunteersEndsBefore,
          null,
          NEEDS_VOLUNTEERS_CANDIDATE_FETCH_LIMIT,
          0,
        ),
      ]);

    if (needsVolunteersPage.total > NEEDS_VOLUNTEERS_CANDIDATE_FETCH_LIMIT) {
      this.logger.warn(
        `Volunteer digest for user ${userId}: needs-volunteers candidate pool (${needsVolunteersPage.total}) exceeds the fetch limit (${NEEDS_VOLUNTEERS_CANDIDATE_FETCH_LIMIT}); some eligible shifts may be missing from this send.`,
      );
    }

    // Both queries fetch `with: { master: true }` at runtime, but their
    // declared return types don't reflect that (they're typed for their
    // primary callers, which use a separate loader for `master`).
    const myShiftInstances = withMaster(myShiftsPage.instances);
    const pendingInviteInstances = withMaster(pendingInvitesPage.instances);
    // findAvailableShiftInstances excludes MY_SHIFT roster invites (joined,
    // awaiting approval, waitlisted) but not coordinator ADMIN_INVITED — the
    // needs-volunteers section additionally filters ACTIVE_SHIFT invites in
    // memory before ranking candidates.
    const needsVolunteersInstances = await this.excludeActivelyInvitedInstances(
      userId,
      withMaster(needsVolunteersPage.instances),
    );

    const unitNameById = new Map(orgUnits.map((unit) => [unit.id, unit.name]));
    const needsVolunteersGroups = await this.buildNeedsVolunteersGroups(
      needsVolunteersInstances,
      orgUnits,
      sendAt,
    );

    const hasAnyContent =
      myShiftInstances.length > 0 ||
      pendingInviteInstances.length > 0 ||
      needsVolunteersGroups.some((group) => group.rows.length > 0);
    if (!hasAnyContent) return;

    const recipient =
      await this.notificationService.resolveUserNotificationData(userId, {
        event: NotificationEvent.VOLUNTEER_DIGEST_SENT,
      });
    if (!recipient) return;

    const templateContext = createEmailTemplateContext(
      this.appI18n,
      recipient.locale,
    );
    const { subject, html } = await volunteerDigestTemplate(
      {
        recipientFirstName: recipient.firstName,
        myShifts: myShiftInstances.map((instance) =>
          toShiftRow(instance, unitNameById),
        ),
        pendingInvites: pendingInviteInstances.map((instance) =>
          toShiftRow(instance, unitNameById),
        ),
        needsVolunteersGroups: needsVolunteersGroups.map(
          (group): NeedsVolunteersGroup => ({
            organizationName: group.organizationName,
            rows: group.rows.map(
              (row): NeedsVolunteersRow => ({
                ...toShiftRow(row.instance, unitNameById),
                reason: row.reason,
              }),
            ),
          }),
        ),
      },
      templateContext,
    );

    try {
      await this.emailService.send({ to: recipient.email, subject, html });
    } catch (error) {
      this.logger.error(
        `Failed to send volunteer digest to user ${userId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      // Don't log needs-volunteers rows as sent if the send itself failed.
      return;
    }

    await this.logNeedsVolunteersRows(userId, sendAt, needsVolunteersGroups);
  }

  private async excludeActivelyInvitedInstances(
    userId: string,
    instances: InstanceWithMaster[],
  ): Promise<InstanceWithMaster[]> {
    if (instances.length === 0) return [];

    const inviteStatuses = await this.shiftService.findInviteStatusesForUser(
      userId,
      instances.map((instance) => instance.id),
    );
    const activelyInvitedInstanceIds = new Set(
      inviteStatuses
        .filter((invite) =>
          ACTIVE_SHIFT_INVITE_STATUSES.includes(invite.status),
        )
        .map((invite) => invite.shiftInstanceId),
    );

    return instances.filter(
      (instance) => !activelyInvitedInstanceIds.has(instance.id),
    );
  }

  private async buildNeedsVolunteersGroups(
    instances: InstanceWithMaster[],
    orgUnits: OrganizationUnitEntity[],
    sendAt: Date,
  ): Promise<
    Array<{
      organizationId: string;
      organizationName: string;
      rows: Array<{
        instance: InstanceWithMaster;
        gap: number;
        reason: NeedsVolunteersRow['reason'];
        acceptedCount: number;
      }>;
    }>
  > {
    if (instances.length === 0) return [];

    const organizationIdByUnitId = new Map(
      orgUnits.map((unit) => [unit.id, unit.organizationId]),
    );

    const instancesByOrganizationId = new Map<string, InstanceWithMaster[]>();
    for (const instance of instances) {
      const organizationId = organizationIdByUnitId.get(
        instance.master.organizationUnitId,
      );
      if (!organizationId) continue; // Not in the accessible-unit set — shouldn't happen.
      const list = instancesByOrganizationId.get(organizationId) ?? [];
      list.push(instance);
      instancesByOrganizationId.set(organizationId, list);
    }

    if (instancesByOrganizationId.size === 0) return [];

    const [filledCounts, organizations] = await Promise.all([
      this.shiftService.getFilledCounts(instances.map((i) => i.id)),
      this.db.query.organizations.findMany({
        where: { id: { in: [...instancesByOrganizationId.keys()] } },
        columns: { id: true, name: true },
      }),
    ]);
    const organizationNameById = new Map(
      organizations.map((org) => [org.id, org.name]),
    );

    const groups: Array<{
      organizationId: string;
      organizationName: string;
      rows: Array<{
        instance: InstanceWithMaster;
        gap: number;
        reason: NeedsVolunteersRow['reason'];
        acceptedCount: number;
      }>;
    }> = [];

    for (const [organizationId, orgInstances] of instancesByOrganizationId) {
      const instanceById = new Map(
        orgInstances.map((instance) => [instance.id, instance]),
      );
      const candidates: NeedsVolunteersCandidate[] = orgInstances.map(
        (instance) => ({
          instanceId: instance.id,
          minVolunteers:
            instance.overrideMinVolunteers ?? instance.master.minVolunteers,
          maxVolunteers:
            instance.overrideMaxVolunteers ?? instance.master.maxVolunteers,
          filledCount: filledCounts.get(instance.id) ?? 0,
          daysLeft: hoursUntil(instance.actualStartsAt, sendAt) / 24,
          actualStartsAt: instance.actualStartsAt,
        }),
      );

      const ranked = rankShiftsNeedingVolunteers(candidates);
      if (ranked.length === 0) continue;

      groups.push({
        organizationId,
        organizationName:
          organizationNameById.get(organizationId) ?? 'Your organization',
        rows: ranked.map((row) => {
          const instance = instanceById.get(row.instanceId);
          if (!instance) {
            throw new Error(
              `Ranked needs-volunteers row references unknown instance ${row.instanceId}`,
            );
          }
          return {
            instance,
            gap: row.gap,
            reason: row.reason,
            acceptedCount: filledCounts.get(row.instanceId) ?? 0,
          };
        }),
      });
    }

    return groups;
  }

  private async logNeedsVolunteersRows(
    userId: string,
    sendAt: Date,
    groups: Awaited<
      ReturnType<VolunteerDigestService['buildNeedsVolunteersGroups']>
    >,
  ): Promise<void> {
    const rows = groups.flatMap((group) =>
      group.rows.map((row, index) => ({
        userId,
        shiftId: row.instance.masterId,
        instanceId: row.instance.id,
        organizationId: group.organizationId,
        position: index + 1,
        sendDate: sendAt,
        acceptedCount: row.acceptedCount,
      })),
    );
    if (rows.length === 0) return;

    await this.db.insert(schema.volunteerDigestShiftLogs).values(rows);
  }
}

function withMaster(instances: ShiftInstanceEntity[]): InstanceWithMaster[] {
  return instances as InstanceWithMaster[];
}

function toShiftRow(
  instance: InstanceWithMaster,
  unitNameById: Map<string, string>,
): VolunteerDigestShiftRow {
  return {
    instanceId: instance.id,
    shiftId: instance.masterId,
    title: instance.overrideTitle ?? instance.master.title,
    organizationUnitName:
      unitNameById.get(instance.master.organizationUnitId) ?? '',
    startsAt: instance.actualStartsAt,
    endsAt: instance.actualEndsAt,
    imageUrl: instance.master.imageUrl,
  };
}

function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 3_600_000);
}

function addDays(date: Date, days: number): Date {
  return addHours(date, days * 24);
}
