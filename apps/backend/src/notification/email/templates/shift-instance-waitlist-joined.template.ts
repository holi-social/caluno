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

export interface ShiftInstanceWaitlistJoinedTemplateData {
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
  data: ShiftInstanceWaitlistJoinedTemplateData,
  { t, formatDate, formatTime }: EmailTemplateContext,
): DetailTableRow[] {
  const organizationUnitName = escapeHtml(data.organizationUnitName);
  const shiftTitle = escapeHtml(data.shiftTitle);
  const shiftLocation = data.shiftLocation
    ? escapeHtml(data.shiftLocation)
    : null;
  const whenValue = escapeHtml(
    t('shiftInstanceWaitlistJoined.whenRange', {
      date: formatDate(data.startsAt),
      timeRange: `${formatTime(data.startsAt)} – ${formatTime(data.endsAt)}`,
    }),
  );

  const rows: DetailTableRow[] = [
    {
      kind: 'pair',
      label: t('shiftInstanceWaitlistJoined.detailShift'),
      value: shiftTitle,
    },
    {
      kind: 'pair',
      label: t('shiftInstanceWaitlistJoined.detailOrganization'),
      value: organizationUnitName,
    },
    {
      kind: 'pair',
      label: t('shiftInstanceWaitlistJoined.detailWhen'),
      value: whenValue,
    },
  ];

  if (shiftLocation) {
    rows.push({
      kind: 'pair',
      label: t('shiftInstanceWaitlistJoined.detailLocation'),
      value: shiftLocation,
    });
  }

  return rows;
}

export async function shiftInstanceWaitlistJoinedTemplate(
  data: ShiftInstanceWaitlistJoinedTemplateData,
  context: EmailTemplateContext,
): Promise<{ subject: string; html: string }> {
  const { t } = context;
  const firstName = escapeHtml(data.recipientFirstName);
  const shiftUrl = shiftPublicUrl(data.shiftId, data.instanceId);
  const brandName = emailTheme.brandName;

  const body = card(`
    ${heading(t('shiftInstanceWaitlistJoined.heading'))}
    ${paragraph(t('shiftInstanceWaitlistJoined.greeting', { firstName }), {
      padding: '0 0 16px',
    })}
    ${detailTable(buildDetailRows(data, context))}
    ${button({ href: shiftUrl, label: t('shiftInstanceWaitlistJoined.buttonLabel') })}
    ${divider('0 0 16px')}
    ${note(t('shiftInstanceWaitlistJoined.note'))}
  `);

  return renderEmail({
    templateName: 'shiftInstanceWaitlistJoinedTemplate',
    subject: t('shiftInstanceWaitlistJoined.subject', {
      shiftTitle: data.shiftTitle,
      organizationName: data.organizationUnitName,
    }),
    previewText: t('shiftInstanceWaitlistJoined.previewText', {
      shiftTitle: data.shiftTitle,
      organizationName: data.organizationUnitName,
    }),
    body,
    footerNote: [
      t('shiftInstanceWaitlistJoined.footerNote', { brandName }),
      unsubscribeFooterNote(t),
    ]
      .filter(Boolean)
      .join('<br />'),
  });
}
