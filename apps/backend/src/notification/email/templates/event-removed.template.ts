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

export interface EventRemovedTemplateData {
  organizationUnitName: string;
  eventTitle: string;
  eventLocation?: string | null;
  recipientFirstName: string;
  startsAt: Date;
  endsAt: Date;
}

function buildDetailRows(
  data: EventRemovedTemplateData,
  { t, formatDate, formatTime }: EmailTemplateContext,
): DetailTableRow[] {
  const organizationUnitName = escapeHtml(data.organizationUnitName);
  const eventTitle = escapeHtml(data.eventTitle);
  const eventLocation = data.eventLocation
    ? escapeHtml(data.eventLocation)
    : null;
  const whenValue = escapeHtml(
    t('eventRemoved.whenRange', {
      date: formatDate(data.startsAt),
      timeRange: `${formatTime(data.startsAt)} – ${formatTime(data.endsAt)}`,
    }),
  );

  const rows: DetailTableRow[] = [
    {
      kind: 'pair',
      label: t('eventRemoved.detailEvent'),
      value: eventTitle,
    },
    {
      kind: 'pair',
      label: t('eventRemoved.detailOrganization'),
      value: organizationUnitName,
    },
    {
      kind: 'pair',
      label: t('eventRemoved.detailWhen'),
      value: whenValue,
    },
  ];

  if (eventLocation) {
    rows.push({
      kind: 'pair',
      label: t('eventRemoved.detailLocation'),
      value: eventLocation,
    });
  }

  return rows;
}

export async function eventRemovedTemplate(
  data: EventRemovedTemplateData,
  context: EmailTemplateContext,
): Promise<{ subject: string; html: string }> {
  const { t } = context;
  const firstName = escapeHtml(data.recipientFirstName);
  const brandName = emailTheme.brandName;

  const body = card(`
    ${heading(t('eventRemoved.heading'))}
    ${paragraph(t('eventRemoved.greeting', { firstName }), {
      padding: '0 0 16px',
    })}
    ${detailTable(buildDetailRows(data, context))}
    ${divider('0 0 16px')}
    ${note(t('eventRemoved.note'))}
  `);

  return renderEmail({
    templateName: 'eventRemovedTemplate',
    subject: t('eventRemoved.subject', {
      eventTitle: data.eventTitle,
      organizationName: data.organizationUnitName,
    }),
    previewText: t('eventRemoved.previewText', {
      eventTitle: data.eventTitle,
      organizationName: data.organizationUnitName,
    }),
    body,
    footerNote: t('eventRemoved.footerNote', { brandName }),
  });
}
