import type { EmailTemplateContext } from '../../../i18n/email-translate';
import {
  button,
  card,
  type DetailTableRow,
  detailTable,
  divider,
  emailBellRingIcon,
  emailTheme,
  escapeHtml,
  heading,
  note,
  paragraph,
  renderEmail,
  shiftPublicUrl,
  text,
} from './shared';
import { formatMultilineHtml } from './shared/utils';

export interface ShiftInstanceRemindedTemplateData {
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
  data: ShiftInstanceRemindedTemplateData,
  { t, formatDate, formatTime }: EmailTemplateContext,
): DetailTableRow[] {
  const organizationUnitName = escapeHtml(data.organizationUnitName);
  const shiftTitle = escapeHtml(data.shiftTitle);
  const shiftLocation = data.shiftLocation
    ? escapeHtml(data.shiftLocation)
    : null;
  const whenValue = escapeHtml(
    t('shiftInstanceReminded.whenRange', {
      date: formatDate(data.startsAt),
      timeRange: `${formatTime(data.startsAt)} – ${formatTime(data.endsAt)}`,
    }),
  );

  const rows: DetailTableRow[] = [
    {
      kind: 'pair',
      label: t('shiftInstanceReminded.detailShift'),
      value: shiftTitle,
    },
    {
      kind: 'pair',
      label: t('shiftInstanceReminded.detailOrganization'),
      value: organizationUnitName,
    },
    {
      kind: 'pair',
      label: t('shiftInstanceReminded.detailWhen'),
      value: whenValue,
    },
  ];

  if (shiftLocation) {
    rows.push({
      kind: 'pair',
      label: t('shiftInstanceReminded.detailLocation'),
      value: shiftLocation,
    });
  }

  if (data.shiftInstructions?.trim()) {
    rows.push({
      kind: 'block',
      label: t('shiftInstanceReminded.detailInstructions'),
      value: formatMultilineHtml(data.shiftInstructions.trim()),
    });
  }

  return rows;
}

export async function shiftInstanceRemindedTemplate(
  data: ShiftInstanceRemindedTemplateData,
  context: EmailTemplateContext,
): Promise<{ subject: string; html: string }> {
  const { t } = context;
  const firstName = escapeHtml(data.recipientFirstName);
  const shiftUrl = shiftPublicUrl(data.shiftId, data.instanceId);
  const brandName = emailTheme.brandName;

  const iconBadge = `<div style="display:inline-block;background-color:${emailTheme.colors.primarySoft};border-radius:9999px;padding:14px;line-height:0;">${emailBellRingIcon(
    emailTheme.colors.primary,
    28,
  )}</div>`;

  const body = card(`
    ${text(iconBadge, { align: 'center', padding: '0 0 16px' })}
    ${heading(t('shiftInstanceReminded.heading'), { color: emailTheme.colors.primary })}
    ${paragraph(t('shiftInstanceReminded.greeting', { firstName }), {
      padding: '0 0 16px',
    })}
    ${detailTable(buildDetailRows(data, context))}
    ${button({ href: shiftUrl, label: t('shiftInstanceReminded.buttonLabel') })}
    ${divider('0 0 16px')}
    ${note(t('shiftInstanceReminded.note'))}
  `);

  return renderEmail({
    templateName: 'shiftInstanceRemindedTemplate',
    subject: t('shiftInstanceReminded.subject', {
      shiftTitle: data.shiftTitle,
    }),
    previewText: t('shiftInstanceReminded.previewText', {
      shiftTitle: data.shiftTitle,
      organizationName: data.organizationUnitName,
    }),
    body,
    footerNote: t('shiftInstanceReminded.footerNote', { brandName }),
  });
}
