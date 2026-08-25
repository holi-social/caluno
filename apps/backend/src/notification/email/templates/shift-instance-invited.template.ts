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
} from './shared';
import { formatMultilineHtml } from './shared/utils';

export interface ShiftInstanceInvitedTemplateData {
  organizationUnitName: string;
  shiftId: string;
  shiftTitle: string;
  shiftLocation?: string | null;
  shiftInstructions?: string | null;
  recipientFirstName: string;
  startsAt: Date;
  endsAt: Date;
  instanceId: string;
}

function buildDetailRows(
  data: ShiftInstanceInvitedTemplateData,
  { t, formatDate, formatTime }: EmailTemplateContext,
): DetailTableRow[] {
  const organizationUnitName = escapeHtml(data.organizationUnitName);
  const shiftTitle = escapeHtml(data.shiftTitle);
  const shiftLocation = data.shiftLocation
    ? escapeHtml(data.shiftLocation)
    : null;
  const whenValue = escapeHtml(
    t('shiftInstanceInvited.whenRange', {
      date: formatDate(data.startsAt),
      timeRange: `${formatTime(data.startsAt)} – ${formatTime(data.endsAt)}`,
    }),
  );

  const rows: DetailTableRow[] = [
    {
      kind: 'pair',
      label: t('shiftInstanceInvited.detailShift'),
      value: shiftTitle,
    },
    {
      kind: 'pair',
      label: t('shiftInstanceInvited.detailOrganization'),
      value: organizationUnitName,
    },
    {
      kind: 'pair',
      label: t('shiftInstanceInvited.detailWhen'),
      value: whenValue,
    },
  ];

  if (shiftLocation) {
    rows.push({
      kind: 'pair',
      label: t('shiftInstanceInvited.detailLocation'),
      value: shiftLocation,
    });
  }

  if (data.shiftInstructions?.trim()) {
    rows.push({
      kind: 'block',
      label: t('shiftInstanceInvited.detailInstructions'),
      value: formatMultilineHtml(data.shiftInstructions.trim()),
    });
  }

  return rows;
}

export async function shiftInstanceInvitedTemplate(
  data: ShiftInstanceInvitedTemplateData,
  context: EmailTemplateContext,
): Promise<{ subject: string; html: string }> {
  const { t } = context;
  const firstName = escapeHtml(data.recipientFirstName);
  const shiftUrl = shiftPublicUrl(data.shiftId, data.instanceId);
  const brandName = emailTheme.brandName;

  const body = card(`
    ${heading(t('shiftInstanceInvited.heading'))}
    ${paragraph(t('shiftInstanceInvited.greeting', { firstName }), {
      padding: '0 0 16px',
    })}
    ${detailTable(buildDetailRows(data, context))}
    ${button({ href: shiftUrl, label: t('shiftInstanceInvited.buttonLabel') })}
    ${divider('0 0 16px')}
    ${note(t('shiftInstanceInvited.note'))}
  `);

  return renderEmail({
    templateName: 'shiftInstanceInvitedTemplate',
    subject: t('shiftInstanceInvited.subject', {
      shiftTitle: data.shiftTitle,
      organizationName: data.organizationUnitName,
    }),
    previewText: t('shiftInstanceInvited.previewText', {
      shiftTitle: data.shiftTitle,
      organizationName: data.organizationUnitName,
    }),
    body,
    footerNote: t('shiftInstanceInvited.footerNote', { brandName }),
  });
}
