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

export interface ShiftSeriesRemovedTemplateData {
  organizationUnitName: string;
  shiftTitle: string;
  shiftLocation?: string | null;
  recipientFirstName: string;
  fromDate: Date;
}

function buildDetailRows(
  data: ShiftSeriesRemovedTemplateData,
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
      label: t('shiftSeriesRemoved.detailShift'),
      value: shiftTitle,
    },
    {
      kind: 'pair',
      label: t('shiftSeriesRemoved.detailOrganization'),
      value: organizationUnitName,
    },
    {
      kind: 'pair',
      label: t('shiftSeriesRemoved.detailFrom'),
      value: escapeHtml(formatDate(data.fromDate)),
    },
  ];

  if (shiftLocation) {
    rows.push({
      kind: 'pair',
      label: t('shiftSeriesRemoved.detailLocation'),
      value: shiftLocation,
    });
  }

  return rows;
}

export async function shiftSeriesRemovedTemplate(
  data: ShiftSeriesRemovedTemplateData,
  context: EmailTemplateContext,
): Promise<{ subject: string; html: string }> {
  const { t, formatDate } = context;
  const firstName = escapeHtml(data.recipientFirstName);
  const brandName = emailTheme.brandName;

  const body = card(`
    ${heading(t('shiftSeriesRemoved.heading'))}
    ${paragraph(t('shiftSeriesRemoved.greeting', { firstName }), {
      padding: '0 0 16px',
    })}
    ${paragraph(
      t('shiftSeriesRemoved.bodyMessage', {
        shiftTitle: escapeHtml(data.shiftTitle),
        fromDate: formatDate(data.fromDate),
      }),
      { padding: '0 0 16px' },
    )}
    ${detailTable(buildDetailRows(data, context))}
    ${divider('0 0 16px')}
    ${note(t('shiftSeriesRemoved.note'))}
  `);

  return renderEmail({
    templateName: 'shiftSeriesRemovedTemplate',
    subject: t('shiftSeriesRemoved.subject', {
      shiftTitle: data.shiftTitle,
    }),
    previewText: t('shiftSeriesRemoved.previewText', {
      shiftTitle: data.shiftTitle,
      organizationName: data.organizationUnitName,
      fromDate: formatDate(data.fromDate),
    }),
    body,
    footerNote: t('shiftSeriesRemoved.footerNote', { brandName }),
  });
}
