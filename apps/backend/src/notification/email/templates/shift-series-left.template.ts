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

export interface ShiftSeriesLeftTemplateData {
  organizationUnitName: string;
  shiftTitle: string;
  shiftLocation?: string | null;
  recipientFirstName: string;
  fromDate: Date;
}

function buildDetailRows(
  data: ShiftSeriesLeftTemplateData,
  { t, formatDate }: EmailTemplateContext,
): DetailTableRow[] {
  const organizationUnitName = escapeHtml(data.organizationUnitName);
  const shiftTitle = escapeHtml(data.shiftTitle);
  const shiftLocation = data.shiftLocation
    ? escapeHtml(data.shiftLocation)
    : null;

  const rows: DetailTableRow[] = [
    {
      kind: 'pair',
      label: t('shiftSeriesLeft.detailShift'),
      value: shiftTitle,
    },
    {
      kind: 'pair',
      label: t('shiftSeriesLeft.detailOrganization'),
      value: organizationUnitName,
    },
    {
      kind: 'pair',
      label: t('shiftSeriesLeft.detailFrom'),
      value: escapeHtml(formatDate(data.fromDate)),
    },
  ];

  if (shiftLocation) {
    rows.push({
      kind: 'pair',
      label: t('shiftSeriesLeft.detailLocation'),
      value: shiftLocation,
    });
  }

  return rows;
}

export async function shiftSeriesLeftTemplate(
  data: ShiftSeriesLeftTemplateData,
  context: EmailTemplateContext,
): Promise<{ subject: string; html: string }> {
  const { t, formatDate } = context;
  const firstName = escapeHtml(data.recipientFirstName);
  const brandName = emailTheme.brandName;

  const body = card(`
    ${heading(t('shiftSeriesLeft.heading'))}
    ${paragraph(t('shiftSeriesLeft.greeting', { firstName }), {
      padding: '0 0 16px',
    })}
    ${paragraph(
      t('shiftSeriesLeft.bodyMessage', {
        shiftTitle: escapeHtml(data.shiftTitle),
        fromDate: formatDate(data.fromDate),
      }),
      { padding: '0 0 16px' },
    )}
    ${detailTable(buildDetailRows(data, context))}
    ${divider('0 0 16px')}
    ${note(t('shiftSeriesLeft.note'))}
  `);

  return renderEmail({
    templateName: 'shiftSeriesLeftTemplate',
    subject: t('shiftSeriesLeft.subject', {
      shiftTitle: data.shiftTitle,
    }),
    previewText: t('shiftSeriesLeft.previewText', {
      shiftTitle: data.shiftTitle,
      organizationName: data.organizationUnitName,
      fromDate: formatDate(data.fromDate),
    }),
    body,
    footerNote: t('shiftSeriesLeft.footerNote', { brandName }),
  });
}
