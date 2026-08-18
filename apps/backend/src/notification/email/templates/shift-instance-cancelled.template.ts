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

export interface ShiftInstanceCancelledTemplateData {
  organizationUnitName: string;
  shiftTitle: string;
  shiftLocation?: string | null;
  recipientFirstName: string;
  startsAt: Date;
  endsAt: Date;
}

function buildDetailRows(
  data: ShiftInstanceCancelledTemplateData,
  { t, formatDate, formatTime }: EmailTemplateContext,
): DetailTableRow[] {
  const organizationUnitName = escapeHtml(data.organizationUnitName);
  const shiftTitle = escapeHtml(data.shiftTitle);
  const shiftLocation = data.shiftLocation
    ? escapeHtml(data.shiftLocation)
    : null;
  const whenValue = escapeHtml(
    t('shiftInstanceCancelled.whenRange', {
      date: formatDate(data.startsAt),
      timeRange: `${formatTime(data.startsAt)} – ${formatTime(data.endsAt)}`,
    }),
  );

  const rows: DetailTableRow[] = [
    {
      kind: 'pair',
      label: t('shiftInstanceCancelled.detailShift'),
      value: shiftTitle,
    },
    {
      kind: 'pair',
      label: t('shiftInstanceCancelled.detailOrganization'),
      value: organizationUnitName,
    },
    {
      kind: 'pair',
      label: t('shiftInstanceCancelled.detailWhen'),
      value: whenValue,
    },
  ];

  if (shiftLocation) {
    rows.push({
      kind: 'pair',
      label: t('shiftInstanceCancelled.detailLocation'),
      value: shiftLocation,
    });
  }

  return rows;
}

export async function shiftInstanceCancelledTemplate(
  data: ShiftInstanceCancelledTemplateData,
  context: EmailTemplateContext,
): Promise<{ subject: string; html: string }> {
  const { t } = context;
  const firstName = escapeHtml(data.recipientFirstName);
  const brandName = emailTheme.brandName;

  const body = card(`
    ${heading(t('shiftInstanceCancelled.heading'))}
    ${paragraph(t('shiftInstanceCancelled.greeting', { firstName }), {
      padding: '0 0 16px',
    })}
    ${detailTable(buildDetailRows(data, context))}
    ${divider('0 0 16px')}
    ${note(t('shiftInstanceCancelled.note'))}
  `);

  return renderEmail({
    templateName: 'shiftInstanceCancelledTemplate',
    subject: t('shiftInstanceCancelled.subject', {
      shiftTitle: data.shiftTitle,
      organizationName: data.organizationUnitName,
    }),
    previewText: t('shiftInstanceCancelled.previewText', {
      shiftTitle: data.shiftTitle,
      organizationName: data.organizationUnitName,
    }),
    body,
    footerNote: t('shiftInstanceCancelled.footerNote', { brandName }),
  });
}
