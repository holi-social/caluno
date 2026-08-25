import type { EmailTemplateContext } from '../../../i18n/email-translate';
import type { ShiftInviteSchedule } from '../../shift-invite-schedule';
import {
  button,
  card,
  type DetailTableRow,
  detailTable,
  divider,
  emailTheme,
  escapeHtml,
  heading,
  note,
  paragraph,
  renderEmail,
  shiftPublicUrl,
} from './shared';
import { formatMultilineHtml } from './shared/utils';

export interface ShiftInvitedTemplateData {
  organizationUnitName: string;
  shiftId: string;
  shiftTitle: string;
  shiftLocation?: string | null;
  shiftInstructions?: string | null;
  recipientFirstName: string;
  schedule: ShiftInviteSchedule;
}

function formatRecurrenceDays(
  schedule: ShiftInviteSchedule,
  { t, formatList }: EmailTemplateContext,
): string | null {
  if (!schedule.isRecurring || schedule.recurrenceDays.length === 0) {
    return null;
  }

  const dayLabels = schedule.recurrenceDays.map((day) =>
    t(`shiftInvited.recurrenceDay.${day}`),
  );

  return formatList(dayLabels);
}

function buildDetailRows(
  data: ShiftInvitedTemplateData,
  context: EmailTemplateContext,
): DetailTableRow[] {
  const { t, formatDate, formatDateTime, formatTime } = context;
  const organizationUnitName = escapeHtml(data.organizationUnitName);
  const shiftTitle = escapeHtml(data.shiftTitle);
  const shiftLocation = data.shiftLocation
    ? escapeHtml(data.shiftLocation)
    : null;
  const { schedule } = data;
  const recurrenceDays = formatRecurrenceDays(schedule, context);
  const timeRange = escapeHtml(
    `${formatTime(schedule.firstOccurrenceStartsAt)} – ${formatTime(schedule.firstOccurrenceEndsAt)}`,
  );

  const rows: DetailTableRow[] = [
    { kind: 'pair', label: t('shiftInvited.detailShift'), value: shiftTitle },
    {
      kind: 'pair',
      label: t('shiftInvited.detailOrganization'),
      value: organizationUnitName,
    },
  ];

  if (schedule.isRecurring && recurrenceDays) {
    rows.push({
      kind: 'pair',
      label: t('shiftInvited.detailSchedule'),
      value: escapeHtml(
        t('shiftInvited.scheduleRecurring', {
          days: recurrenceDays,
          timeRange: `${formatTime(schedule.firstOccurrenceStartsAt)} – ${formatTime(schedule.firstOccurrenceEndsAt)}`,
        }),
      ),
    });

    const startDate = formatDate(schedule.firstOccurrenceStartsAt);
    if (schedule.recurrenceEndDate) {
      rows.push({
        kind: 'pair',
        label: t('shiftInvited.detailPeriod'),
        value: escapeHtml(
          t('shiftInvited.periodWithCount', {
            startDate,
            endDate: formatDate(schedule.recurrenceEndDate),
            count: schedule.occurrenceCount,
          }),
        ),
      });
    } else {
      rows.push({
        kind: 'pair',
        label: t('shiftInvited.detailPeriod'),
        value: escapeHtml(
          t('shiftInvited.periodOpenWithCount', {
            startDate,
            count: schedule.occurrenceCount,
          }),
        ),
      });
    }
  } else {
    rows.push({
      kind: 'pair',
      label: t('shiftInvited.detailWhen'),
      value: escapeHtml(formatDateTime(schedule.firstOccurrenceStartsAt)),
    });
    rows.push({
      kind: 'pair',
      label: t('shiftInvited.detailTime'),
      value: timeRange,
    });
  }

  if (shiftLocation) {
    rows.push({
      kind: 'pair',
      label: t('shiftInvited.detailLocation'),
      value: shiftLocation,
    });
  }

  if (data.shiftInstructions?.trim()) {
    rows.push({
      kind: 'block',
      label: t('shiftInvited.detailInstructions'),
      value: formatMultilineHtml(data.shiftInstructions.trim()),
    });
  }

  return rows;
}

export async function shiftInvitedTemplate(
  data: ShiftInvitedTemplateData,
  context: EmailTemplateContext,
): Promise<{ subject: string; html: string }> {
  const { t, formatDate, formatDateTime, formatTime } = context;
  const firstName = escapeHtml(data.recipientFirstName);
  const shiftUrl = shiftPublicUrl(data.shiftId);
  const brandName = emailTheme.brandName;
  const { schedule } = data;
  const recurrenceDays = formatRecurrenceDays(schedule, context);

  const greetingKey = schedule.isRecurring
    ? 'shiftInvited.greetingRecurring'
    : 'shiftInvited.greeting';

  const previewText = schedule.isRecurring
    ? t('shiftInvited.previewTextRecurring', {
        shiftTitle: data.shiftTitle,
        organizationName: data.organizationUnitName,
        days: recurrenceDays ?? '',
        timeRange: `${formatTime(schedule.firstOccurrenceStartsAt)} – ${formatTime(schedule.firstOccurrenceEndsAt)}`,
        firstDate: formatDate(schedule.firstOccurrenceStartsAt),
        count: schedule.occurrenceCount,
      })
    : t('shiftInvited.previewText', {
        shiftTitle: data.shiftTitle,
        organizationName: data.organizationUnitName,
        when: formatDateTime(schedule.firstOccurrenceStartsAt),
      });

  const body = card(`
    ${heading(t('shiftInvited.heading'))}
    ${paragraph(t(greetingKey, { firstName }), {
      padding: '0 0 16px',
    })}
    ${detailTable(buildDetailRows(data, context))}
    ${button({ href: shiftUrl, label: t('shiftInvited.buttonLabel') })}
    ${divider('0 0 16px')}
    ${note(
      schedule.isRecurring
        ? t('shiftInvited.noteRecurring')
        : t('shiftInvited.note'),
    )}
  `);

  return renderEmail({
    templateName: 'shiftInvitedTemplate',
    subject: t('shiftInvited.subject', {
      shiftTitle: data.shiftTitle,
      organizationName: data.organizationUnitName,
    }),
    previewText,
    body,
    footerNote: t('shiftInvited.footerNote', { brandName }),
  });
}
