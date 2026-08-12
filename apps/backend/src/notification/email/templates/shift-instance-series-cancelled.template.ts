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

export interface ShiftInstanceSeriesCancelledTemplateData {
  organizationUnitName: string;
  shiftTitle: string;
  shiftLocation?: string | null;
  recipientFirstName: string;
  fromDate: Date;
}

function buildDetailRows(
  data: ShiftInstanceSeriesCancelledTemplateData,
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
      label: t('shiftInstanceSeriesCancelled.detailShift'),
      value: shiftTitle,
    },
    {
      kind: 'pair',
      label: t('shiftInstanceSeriesCancelled.detailOrganization'),
      value: organizationUnitName,
    },
    {
      kind: 'pair',
      label: t('shiftInstanceSeriesCancelled.detailFrom'),
      value: escapeHtml(formatDate(data.fromDate)),
    },
  ];

  if (shiftLocation) {
    rows.push({
      kind: 'pair',
      label: t('shiftInstanceSeriesCancelled.detailLocation'),
      value: shiftLocation,
    });
  }

  return rows;
}

export async function shiftInstanceSeriesCancelledTemplate(
  data: ShiftInstanceSeriesCancelledTemplateData,
  context: EmailTemplateContext,
): Promise<{ subject: string; html: string }> {
  const { t, formatDate } = context;
  const firstName = escapeHtml(data.recipientFirstName);
  const brandName = emailTheme.brandName;

  const body = card(`
    ${heading(t('shiftInstanceSeriesCancelled.heading'))}
    ${paragraph(t('shiftInstanceSeriesCancelled.greeting', { firstName }), {
      padding: '0 0 16px',
    })}
    ${paragraph(
      t('shiftInstanceSeriesCancelled.bodyMessage', {
        shiftTitle: data.shiftTitle,
        fromDate: formatDate(data.fromDate),
      }),
      { padding: '0 0 16px' },
    )}
    ${detailTable(buildDetailRows(data, context))}
    ${divider('0 0 16px')}
    ${note(t('shiftInstanceSeriesCancelled.note'))}
  `);

  return renderEmail({
    templateName: 'shiftInstanceSeriesCancelledTemplate',
    subject: t('shiftInstanceSeriesCancelled.subject', {
      shiftTitle: data.shiftTitle,
    }),
    previewText: t('shiftInstanceSeriesCancelled.previewText', {
      shiftTitle: data.shiftTitle,
      organizationName: data.organizationUnitName,
      fromDate: formatDate(data.fromDate),
    }),
    body,
    footerNote: t('shiftInstanceSeriesCancelled.footerNote', { brandName }),
  });
}
