import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import type { Database } from '../../database/database.module';
import { DATABASE_CONNECTION } from '../../database/database-connection';
import * as schema from '../../database/schema';
import {
  ConflictGraphQLError,
  NotFoundGraphQLError,
} from '../../graphql/errors';
import { AppI18nService } from '../../i18n/app-i18n.service';
import { EmailService } from '../../notification/email/email.service';
import { createEmailTemplateContext } from '../../notification/email/email-template-context';
import { shiftInstanceRemindedTemplate } from '../../notification/email/templates/shift-instance-reminded.template';
import { NotificationService } from '../../notification/notification.service';
import { NotificationEvent } from '../../notification/notification-events';
import {
  POSTHOG_EVENT,
  POSTHOG_SURFACE,
} from '../../shared/observability/posthog.events';
import { PostHogService } from '../../shared/observability/posthog.service';
import { ShiftInviteStatus } from '../enums';
import { ShiftService } from '../shift.service';

@Injectable()
export class ShiftInviteReminderService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: Database,
    private readonly shiftService: ShiftService,
    private readonly notificationService: NotificationService,
    private readonly emailService: EmailService,
    private readonly appI18n: AppI18nService,
    private readonly postHogService: PostHogService,
  ) {}

  async sendInviteReminder(
    instanceId: string,
    userId: string,
    organizationUnitId: string,
    actorUserId: string,
  ): Promise<Date> {
    const instance = await this.shiftService.findInstanceById(
      instanceId,
      organizationUnitId,
    );

    if (instance.isCancelled) {
      throw new ConflictGraphQLError(
        'Cannot send a reminder for a cancelled shift instance',
      );
    }
    if (instance.actualEndsAt.getTime() < Date.now()) {
      throw new ConflictGraphQLError(
        'Cannot send a reminder for a past shift instance',
      );
    }

    const invite = await this.db.query.shiftInstanceInvites.findFirst({
      where: { instanceId, userId },
    });
    if (!invite) {
      throw new NotFoundGraphQLError('Shift instance invite not found');
    }

    if (invite.status !== ShiftInviteStatus.ADMIN_INVITED) {
      throw new ConflictGraphQLError(
        'Can only remind volunteers with an unanswered invite',
      );
    }
    if (invite.remindedAt) {
      throw new ConflictGraphQLError(
        'This volunteer has already been reminded for this invite',
      );
    }

    const [organizationUnit, recipient] = await Promise.all([
      this.db.query.organizationUnits.findFirst({
        where: { id: instance.master.organizationUnitId },
        columns: { id: true, name: true, organizationId: true },
      }),
      this.notificationService.resolveUserNotificationData(userId, {
        event: NotificationEvent.SHIFT_INSTANCE_INVITE_REMINDER,
      }),
    ]);
    if (!organizationUnit) {
      throw new NotFoundGraphQLError('Organization unit not found');
    }
    if (!recipient) {
      throw new NotFoundGraphQLError('Volunteer not found');
    }

    const templateContext = createEmailTemplateContext(
      this.appI18n,
      recipient.locale,
    );
    const { subject, html } = await shiftInstanceRemindedTemplate(
      {
        organizationUnitName: organizationUnit.name,
        shiftId: instance.masterId,
        shiftTitle: instance.overrideTitle ?? instance.master.title,
        shiftLocation: instance.overrideLocation ?? instance.master.location,
        shiftInstructions:
          instance.overrideInstructions ?? instance.master.instructions,
        recipientFirstName: recipient.firstName,
        startsAt: instance.actualStartsAt,
        endsAt: instance.actualEndsAt,
        instanceId: instance.id,
      },
      templateContext,
    );

    // `remindedAt` means "email sent" — only stamp it after a successful
    // send, so a transport failure leaves the reminder available to retry.
    await this.emailService.send({ to: recipient.email, subject, html });

    const remindedAt = new Date();
    const [updated] = await this.db
      .update(schema.shiftInstanceInvites)
      .set({ remindedAt })
      .where(
        and(
          eq(schema.shiftInstanceInvites.instanceId, instanceId),
          eq(schema.shiftInstanceInvites.userId, userId),
        ),
      )
      .returning({ remindedAt: schema.shiftInstanceInvites.remindedAt });

    this.postHogService.capture({
      event: POSTHOG_EVENT.SHIFT_INSTANCE_INVITE_SEND,
      userId: actorUserId,
      properties: {
        surface: POSTHOG_SURFACE.BACKOFFICE,
        organization_id: organizationUnit.organizationId ?? undefined,
        organization_unit_id: organizationUnit.id,
        shift_id: instance.masterId,
        shift_instance_id: instance.id,
      },
    });

    return updated?.remindedAt ?? remindedAt;
  }
}
