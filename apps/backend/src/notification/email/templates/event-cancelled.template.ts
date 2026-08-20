import type { EmailTemplateContext } from '../../../i18n/email-translate';
import {
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
} from './shared';

export interface EventCancelledTemplateData {
  organizationUnitName: string;
  eventTitle: string;
  eventLocation?: string | null;
  recipientFirstName: string;
  startsAt: Date;
  endsAt: Date;
}

function buildDetailRows(
  data: EventCancelledTemplateData,
  { t, formatDate, formatTime }: EmailTemplateContext,
): DetailTableRow[] {
  const organizationUnitName = escapeHtml(data.organizationUnitName);
  const eventTitle = escapeHtml(data.eventTitle);
  const eventLocation = data.eventLocation
    ? escapeHtml(data.eventLocation)
    : null;
  const whenValue = escapeHtml(
    t('eventCancelled.whenRange', {
      date: formatDate(data.startsAt),
      timeRange: `${formatTime(data.startsAt)} – ${formatTime(data.endsAt)}`,
    }),
  );

  const rows: DetailTableRow[] = [
    {
      kind: 'pair',
      label: t('eventCancelled.detailEvent'),
      value: eventTitle,
    },
    {
      kind: 'pair',
      label: t('eventCancelled.detailOrganization'),
      value: organizationUnitName,
    },
    {
      kind: 'pair',
      label: t('eventCancelled.detailWhen'),
      value: whenValue,
    },
  ];

  if (eventLocation) {
    rows.push({
      kind: 'pair',
      label: t('eventCancelled.detailLocation'),
      value: eventLocation,
    });
  }

  return rows;
}

export async function eventCancelledTemplate(
  data: EventCancelledTemplateData,
  context: EmailTemplateContext,
): Promise<{ subject: string; html: string }> {
  const { t } = context;
  const firstName = escapeHtml(data.recipientFirstName);
  const brandName = emailTheme.brandName;

  const body = card(`
    ${heading(t('eventCancelled.heading'))}
    ${paragraph(t('eventCancelled.greeting', { firstName }), {
      padding: '0 0 16px',
    })}
    ${detailTable(buildDetailRows(data, context))}
    ${divider('0 0 16px')}
    ${note(t('eventCancelled.note'))}
  `);

  return renderEmail({
    templateName: 'eventCancelledTemplate',
    subject: t('eventCancelled.subject', {
      eventTitle: data.eventTitle,
      organizationName: data.organizationUnitName,
    }),
    previewText: t('eventCancelled.previewText', {
      eventTitle: data.eventTitle,
      organizationName: data.organizationUnitName,
    }),
    body,
    footerNote: t('eventCancelled.footerNote', { brandName }),
  });
}
