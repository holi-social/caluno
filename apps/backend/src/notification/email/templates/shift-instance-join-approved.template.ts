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

export interface ShiftInstanceJoinApprovedTemplateData {
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
  data: ShiftInstanceJoinApprovedTemplateData,
  { t, formatDate, formatTime }: EmailTemplateContext,
): DetailTableRow[] {
  const organizationUnitName = escapeHtml(data.organizationUnitName);
  const shiftTitle = escapeHtml(data.shiftTitle);
  const shiftLocation = data.shiftLocation
    ? escapeHtml(data.shiftLocation)
    : null;
  const whenValue = escapeHtml(
    t('shiftInstanceJoinApproved.whenRange', {
      date: formatDate(data.startsAt),
      timeRange: `${formatTime(data.startsAt)} – ${formatTime(data.endsAt)}`,
    }),
  );

  const rows: DetailTableRow[] = [
    {
      kind: 'pair',
      label: t('shiftInstanceJoinApproved.detailShift'),
      value: shiftTitle,
    },
    {
      kind: 'pair',
      label: t('shiftInstanceJoinApproved.detailOrganization'),
      value: organizationUnitName,
    },
    {
      kind: 'pair',
      label: t('shiftInstanceJoinApproved.detailWhen'),
      value: whenValue,
    },
  ];

  if (shiftLocation) {
    rows.push({
      kind: 'pair',
      label: t('shiftInstanceJoinApproved.detailLocation'),
      value: shiftLocation,
    });
  }

  return rows;
}

export async function shiftInstanceJoinApprovedTemplate(
  data: ShiftInstanceJoinApprovedTemplateData,
  context: EmailTemplateContext,
): Promise<{ subject: string; html: string }> {
  const { t } = context;
  const firstName = escapeHtml(data.recipientFirstName);
  const shiftUrl = shiftPublicUrl(data.shiftId, data.instanceId);
  const brandName = emailTheme.brandName;

  const body = card(`
    ${heading(t('shiftInstanceJoinApproved.heading'))}
    ${paragraph(t('shiftInstanceJoinApproved.greeting', { firstName }), {
      padding: '0 0 16px',
    })}
    ${detailTable(buildDetailRows(data, context))}
    ${button({ href: shiftUrl, label: t('shiftInstanceJoinApproved.buttonLabel') })}
    ${divider('0 0 16px')}
    ${note(t('shiftInstanceJoinApproved.note'))}
  `);

  return renderEmail({
    templateName: 'shiftInstanceJoinApprovedTemplate',
    subject: t('shiftInstanceJoinApproved.subject', {
      shiftTitle: data.shiftTitle,
      organizationName: data.organizationUnitName,
    }),
    previewText: t('shiftInstanceJoinApproved.previewText', {
      shiftTitle: data.shiftTitle,
      organizationName: data.organizationUnitName,
    }),
    body,
    footerNote: [
      t('shiftInstanceJoinApproved.footerNote', { brandName }),
      unsubscribeFooterNote(t),
    ]
      .filter(Boolean)
      .join('<br />'),
  });
}
