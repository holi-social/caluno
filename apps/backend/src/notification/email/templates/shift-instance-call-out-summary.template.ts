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

export interface ShiftInstanceCallOutSummaryTemplateData {
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
  callOutRecipientCount: number;
}

function buildDetailRows(
  data: ShiftInstanceCallOutSummaryTemplateData,
  { t, formatDate, formatTime }: EmailTemplateContext,
): DetailTableRow[] {
  return [
    {
      kind: 'pair',
      label: t('shiftInstanceCallOutSummary.detailShift'),
      value: escapeHtml(data.shiftTitle),
    },
    {
      kind: 'pair',
      label: t('shiftInstanceCallOutSummary.detailOrganization'),
      value: escapeHtml(data.organizationUnitName),
    },
    {
      kind: 'pair',
      label: t('shiftInstanceCallOutSummary.detailWhen'),
      value: `<strong style="color:${emailTheme.colors.primary};font-weight:700">${escapeHtml(
        t('shiftInstanceCallOutSummary.whenRange', {
          date: formatDate(data.startsAt),
          timeRange: `${formatTime(data.startsAt)} – ${formatTime(data.endsAt)}`,
        }),
      )}</strong>`,
    },
    {
      kind: 'pair',
      label: t('shiftInstanceCallOutSummary.detailStaffing'),
      value: escapeHtml(
        t('shiftInstanceCallOutSummary.staffingValue', {
          filledCount: data.filledCount,
          minVolunteers: data.minVolunteers,
        }),
      ),
    },
  ];
}

export async function shiftInstanceCallOutSummaryTemplate(
  data: ShiftInstanceCallOutSummaryTemplateData,
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

  // Never claim the group was notified if the automatic call-out actually
  // had nobody left to ask.
  const noticeCopy =
    data.callOutRecipientCount > 0
      ? t('shiftInstanceCallOutSummary.noticeNotified', {
          count: data.callOutRecipientCount,
        })
      : t('shiftInstanceCallOutSummary.noticeNoneAvailable');

  const iconBadge = `<div style="display:inline-block;background-color:${emailTheme.colors.primarySoft};border-radius:9999px;padding:14px;line-height:0;">${emailMegaphoneIcon(
    emailTheme.colors.primary,
    28,
  )}</div>`;

  const body = card(`
    ${text(iconBadge, { align: 'center', padding: '0 0 16px' })}
    ${heading(t('shiftInstanceCallOutSummary.heading'), { color: emailTheme.colors.primary })}
    ${paragraph(
      t('shiftInstanceCallOutSummary.greeting', {
        firstName,
        shiftTitle: escapeHtml(data.shiftTitle),
        organizationName: organizationUnitName,
      }),
      { padding: '0 0 16px' },
    )}
    ${detailTable(buildDetailRows(data, context))}
    ${paragraph(noticeCopy, { padding: '0 0 16px' })}
    ${button({ href: instanceUrl, label: t('shiftInstanceCallOutSummary.buttonLabel') })}
  `);

  return renderEmail({
    templateName: 'shiftInstanceCallOutSummaryTemplate',
    subject: t('shiftInstanceCallOutSummary.subject', {
      shiftTitle: data.shiftTitle,
    }),
    previewText: t('shiftInstanceCallOutSummary.previewText', {
      shiftTitle: data.shiftTitle,
    }),
    body,
    footerNote: t('shiftInstanceCallOutSummary.footerNote', {
      brandName,
    }),
  });
}
