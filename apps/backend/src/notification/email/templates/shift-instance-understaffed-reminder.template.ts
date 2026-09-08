import type { EmailTemplateContext } from '../../../i18n/email-translate';
import {
  button,
  card,
  type DetailTableRow,
  detailTable,
  emailMegaphoneIcon,
  emailTheme,
  escapeHtml,
  heading,
  paragraph,
  renderEmail,
  shiftInstanceAdminUrl,
  text,
} from './shared';

export interface ShiftInstanceUnderstaffedReminderTemplateData {
  organizationUnitId: string;
  organizationUnitName: string;
  shiftId: string;
  shiftTitle: string;
  instanceId: string;
  recipientFirstName: string;
  startsAt: Date;
  endsAt: Date;
  filledCount: number;
  minVolunteers: number;
}

function buildDetailRows(
  data: ShiftInstanceUnderstaffedReminderTemplateData,
  { t, formatDate, formatTime }: EmailTemplateContext,
): DetailTableRow[] {
  return [
    {
      kind: 'pair',
      label: t('shiftInstanceUnderstaffedReminder.detailShift'),
      value: escapeHtml(data.shiftTitle),
    },
    {
      kind: 'pair',
      label: t('shiftInstanceUnderstaffedReminder.detailOrganization'),
      value: escapeHtml(data.organizationUnitName),
    },
    {
      kind: 'pair',
      label: t('shiftInstanceUnderstaffedReminder.detailWhen'),
      value: `<strong style="color:${emailTheme.colors.primary};font-weight:700">${escapeHtml(
        t('shiftInstanceUnderstaffedReminder.whenRange', {
          date: formatDate(data.startsAt),
          timeRange: `${formatTime(data.startsAt)} – ${formatTime(data.endsAt)}`,
        }),
      )}</strong>`,
    },
    {
      kind: 'pair',
      label: t('shiftInstanceUnderstaffedReminder.detailStaffing'),
      value: escapeHtml(
        t('shiftInstanceUnderstaffedReminder.staffingValue', {
          filledCount: data.filledCount,
          minVolunteers: data.minVolunteers,
        }),
      ),
    },
  ];
}

export async function shiftInstanceUnderstaffedReminderTemplate(
  data: ShiftInstanceUnderstaffedReminderTemplateData,
  context: EmailTemplateContext,
): Promise<{ subject: string; html: string }> {
  const { t } = context;
  const firstName = escapeHtml(data.recipientFirstName);
  const organizationUnitName = escapeHtml(data.organizationUnitName);
  const instanceUrl = shiftInstanceAdminUrl(
    data.organizationUnitId,
    data.shiftId,
    data.instanceId,
  );
  const brandName = emailTheme.brandName;

  const iconBadge = `<div style="display:inline-block;background-color:${emailTheme.colors.primarySoft};border-radius:9999px;padding:14px;line-height:0;">${emailMegaphoneIcon(
    emailTheme.colors.primary,
    28,
  )}</div>`;

  const body = card(`
    ${text(iconBadge, { align: 'center', padding: '0 0 16px' })}
    ${heading(t('shiftInstanceUnderstaffedReminder.heading'), { color: emailTheme.colors.primary })}
    ${paragraph(
      t('shiftInstanceUnderstaffedReminder.greeting', {
        firstName,
        shiftTitle: escapeHtml(data.shiftTitle),
        organizationName: organizationUnitName,
      }),
      { padding: '0 0 16px' },
    )}
    ${detailTable(buildDetailRows(data, context))}
    ${button({ href: instanceUrl, label: t('shiftInstanceUnderstaffedReminder.buttonLabel') })}
  `);

  return renderEmail({
    templateName: 'shiftInstanceUnderstaffedReminderTemplate',
    subject: t('shiftInstanceUnderstaffedReminder.subject', {
      shiftTitle: data.shiftTitle,
    }),
    previewText: t('shiftInstanceUnderstaffedReminder.previewText', {
      shiftTitle: data.shiftTitle,
    }),
    body,
    footerNote: t('shiftInstanceUnderstaffedReminder.footerNote', {
      brandName,
    }),
  });
}
