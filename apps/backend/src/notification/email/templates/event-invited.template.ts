import type { EmailTemplateContext } from '../../../i18n/email-translate';
import {
  button,
  card,
  type DetailTableRow,
  detailTable,
  divider,
  emailTheme,
  escapeHtml,
  eventPublicUrl,
  heading,
  note,
  paragraph,
  renderEmail,
} from './shared';

export interface EventInvitedTemplateData {
  eventId: string;
  organizationUnitName: string;
  eventTitle: string;
  eventLocation?: string | null;
  recipientFirstName: string;
  startsAt: Date;
  endsAt: Date;
}

function buildDetailRows(
  data: EventInvitedTemplateData,
  { t, formatDate, formatTime }: EmailTemplateContext,
): DetailTableRow[] {
  const organizationUnitName = escapeHtml(data.organizationUnitName);
  const eventTitle = escapeHtml(data.eventTitle);
  const eventLocation = data.eventLocation
    ? escapeHtml(data.eventLocation)
    : null;
  const whenValue = escapeHtml(
    t('eventInvited.whenRange', {
      date: formatDate(data.startsAt),
      timeRange: `${formatTime(data.startsAt)} – ${formatTime(data.endsAt)}`,
    }),
  );

  const rows: DetailTableRow[] = [
    {
      kind: 'pair',
      label: t('eventInvited.detailEvent'),
      value: eventTitle,
    },
    {
      kind: 'pair',
      label: t('eventInvited.detailOrganization'),
      value: organizationUnitName,
    },
    {
      kind: 'pair',
      label: t('eventInvited.detailWhen'),
      value: whenValue,
    },
  ];

  if (eventLocation) {
    rows.push({
      kind: 'pair',
      label: t('eventInvited.detailLocation'),
      value: eventLocation,
    });
  }

  return rows;
}

export async function eventInvitedTemplate(
  data: EventInvitedTemplateData,
  context: EmailTemplateContext,
): Promise<{ subject: string; html: string }> {
  const { t } = context;
  const firstName = escapeHtml(data.recipientFirstName);
  const eventUrl = eventPublicUrl(data.eventId);
  const brandName = emailTheme.brandName;

  const body = card(`
    ${heading(t('eventInvited.heading'))}
    ${paragraph(t('eventInvited.greeting', { firstName }), {
      padding: '0 0 16px',
    })}
    ${detailTable(buildDetailRows(data, context))}
    ${button({ href: eventUrl, label: t('eventInvited.buttonLabel') })}
    ${divider('0 0 16px')}
    ${note(t('eventInvited.note'))}
  `);

  return renderEmail({
    templateName: 'eventInvitedTemplate',
    subject: t('eventInvited.subject', {
      eventTitle: data.eventTitle,
      organizationName: data.organizationUnitName,
    }),
    previewText: t('eventInvited.previewText', {
      eventTitle: data.eventTitle,
      organizationName: data.organizationUnitName,
    }),
    body,
    footerNote: t('eventInvited.footerNote', { brandName }),
  });
}
