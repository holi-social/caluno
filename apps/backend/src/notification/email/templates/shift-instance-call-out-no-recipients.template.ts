import type { EmailTemplateContext } from '../../../i18n/email-translate';
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
  shiftsAdminUrl,
} from './shared';

export interface ShiftInstanceCallOutNoRecipientsTemplateData {
  organizationUnitId: string;
  organizationUnitName: string;
  shiftTitle: string;
  recipientFirstName: string;
  startsAt: Date;
  endsAt: Date;
}

function buildDetailRows(
  data: ShiftInstanceCallOutNoRecipientsTemplateData,
  { t, formatDate, formatTime }: EmailTemplateContext,
): DetailTableRow[] {
  return [
    {
      kind: 'pair',
      label: t('shiftInstanceCallOutNoRecipients.detailShift'),
      value: escapeHtml(data.shiftTitle),
    },
    {
      kind: 'pair',
      label: t('shiftInstanceCallOutNoRecipients.detailOrganization'),
      value: escapeHtml(data.organizationUnitName),
    },
    {
      kind: 'pair',
      label: t('shiftInstanceCallOutNoRecipients.detailWhen'),
      value: escapeHtml(
        t('shiftInstanceCallOutNoRecipients.whenRange', {
          date: formatDate(data.startsAt),
          timeRange: `${formatTime(data.startsAt)} – ${formatTime(data.endsAt)}`,
        }),
      ),
    },
  ];
}

export async function shiftInstanceCallOutNoRecipientsTemplate(
  data: ShiftInstanceCallOutNoRecipientsTemplateData,
  context: EmailTemplateContext,
): Promise<{ subject: string; html: string }> {
  const { t } = context;
  const firstName = escapeHtml(data.recipientFirstName);
  const shiftsUrl = shiftsAdminUrl(data.organizationUnitId);
  const brandName = emailTheme.brandName;

  const body = card(`
    ${heading(t('shiftInstanceCallOutNoRecipients.heading'))}
    ${paragraph(
      t('shiftInstanceCallOutNoRecipients.greeting', {
        firstName,
        shiftTitle: escapeHtml(data.shiftTitle),
      }),
      { padding: '0 0 16px' },
    )}
    ${detailTable(buildDetailRows(data, context))}
    ${button({
      href: shiftsUrl,
      label: t('shiftInstanceCallOutNoRecipients.buttonLabel'),
    })}
    ${divider('0 0 16px')}
    ${note(t('shiftInstanceCallOutNoRecipients.note'))}
  `);

  return renderEmail({
    templateName: 'shiftInstanceCallOutNoRecipientsTemplate',
    subject: t('shiftInstanceCallOutNoRecipients.subject', {
      shiftTitle: data.shiftTitle,
    }),
    previewText: t('shiftInstanceCallOutNoRecipients.previewText', {
      shiftTitle: data.shiftTitle,
    }),
    body,
    footerNote: t('shiftInstanceCallOutNoRecipients.footerNote', {
      brandName,
    }),
  });
}
