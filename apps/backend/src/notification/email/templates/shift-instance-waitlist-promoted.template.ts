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
  shiftPublicUrl,
  unsubscribeFooterNote,
} from './shared';

export interface ShiftInstanceWaitlistPromotedTemplateData {
  organizationUnitName: string;
  shiftId: string;
  shiftTitle: string;
  shiftLocation?: string | null;
  recipientFirstName: string;
  startsAt: Date;
  endsAt: Date;
  instanceId: string;
}

function buildDetailRows(
  data: ShiftInstanceWaitlistPromotedTemplateData,
  { t, formatDate, formatTime }: EmailTemplateContext,
): DetailTableRow[] {
  const organizationUnitName = escapeHtml(data.organizationUnitName);
  const shiftTitle = escapeHtml(data.shiftTitle);
  const shiftLocation = data.shiftLocation
    ? escapeHtml(data.shiftLocation)
    : null;
  const whenValue = escapeHtml(
    t('shiftInstanceWaitlistPromoted.whenRange', {
      date: formatDate(data.startsAt),
      timeRange: `${formatTime(data.startsAt)} – ${formatTime(data.endsAt)}`,
    }),
  );

  const rows: DetailTableRow[] = [
    {
      kind: 'pair',
      label: t('shiftInstanceWaitlistPromoted.detailShift'),
      value: shiftTitle,
    },
    {
      kind: 'pair',
      label: t('shiftInstanceWaitlistPromoted.detailOrganization'),
      value: organizationUnitName,
    },
    {
      kind: 'pair',
      label: t('shiftInstanceWaitlistPromoted.detailWhen'),
      value: whenValue,
    },
  ];

  if (shiftLocation) {
    rows.push({
      kind: 'pair',
      label: t('shiftInstanceWaitlistPromoted.detailLocation'),
      value: shiftLocation,
    });
  }

  return rows;
}

export async function shiftInstanceWaitlistPromotedTemplate(
  data: ShiftInstanceWaitlistPromotedTemplateData,
  context: EmailTemplateContext,
): Promise<{ subject: string; html: string }> {
  const { t } = context;
  const firstName = escapeHtml(data.recipientFirstName);
  const shiftUrl = shiftPublicUrl(data.shiftId, data.instanceId);
  const brandName = emailTheme.brandName;

  const body = card(`
    ${heading(t('shiftInstanceWaitlistPromoted.heading'))}
    ${paragraph(t('shiftInstanceWaitlistPromoted.greeting', { firstName }), {
      padding: '0 0 16px',
    })}
    ${detailTable(buildDetailRows(data, context))}
    ${button({ href: shiftUrl, label: t('shiftInstanceWaitlistPromoted.buttonLabel') })}
    ${divider('0 0 16px')}
    ${note(t('shiftInstanceWaitlistPromoted.note'))}
  `);

  return renderEmail({
    templateName: 'shiftInstanceWaitlistPromotedTemplate',
    subject: t('shiftInstanceWaitlistPromoted.subject', {
      shiftTitle: data.shiftTitle,
      organizationName: data.organizationUnitName,
    }),
    previewText: t('shiftInstanceWaitlistPromoted.previewText', {
      shiftTitle: data.shiftTitle,
      organizationName: data.organizationUnitName,
    }),
    body,
    footerNote: [
      t('shiftInstanceWaitlistPromoted.footerNote', { brandName }),
      unsubscribeFooterNote(t),
    ]
      .filter(Boolean)
      .join('<br />'),
  });
}
