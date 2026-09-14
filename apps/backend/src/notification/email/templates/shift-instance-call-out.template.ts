import type { EmailTemplateContext } from '../../../i18n/email-translate';
import {
  button,
  card,
  type DetailTableRow,
  detailTable,
  emailMegaphoneIcon,
  emailTheme,
  escapeHtml,
  heading,
  paragraph,
  renderEmail,
  shiftPublicUrl,
  text,
  unsubscribeFooterNote,
} from './shared';

export interface ShiftInstanceCallOutTemplateData {
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
  data: ShiftInstanceCallOutTemplateData,
  { t, formatDate, formatTime }: EmailTemplateContext,
): DetailTableRow[] {
  const rows: DetailTableRow[] = [
    {
      kind: 'pair',
      label: t('shiftInstanceCallOut.detailShift'),
      value: escapeHtml(data.shiftTitle),
    },
    {
      kind: 'pair',
      label: t('shiftInstanceCallOut.detailOrganization'),
      value: escapeHtml(data.organizationUnitName),
    },
    {
      kind: 'pair',
      label: t('shiftInstanceCallOut.detailWhen'),
      // Bolded and tinted with the urgent accent color — timing is the one
      // detail that most directly drives whether someone can help.
      value: `<strong style="color:${emailTheme.colors.primary};font-weight:700">${escapeHtml(
        t('shiftInstanceCallOut.whenRange', {
          date: formatDate(data.startsAt),
          timeRange: `${formatTime(data.startsAt)} – ${formatTime(data.endsAt)}`,
        }),
      )}</strong>`,
    },
  ];

  if (data.shiftLocation) {
    rows.push({
      kind: 'pair',
      label: t('shiftInstanceCallOut.detailLocation'),
      value: escapeHtml(data.shiftLocation),
    });
  }

  return rows;
}

export async function shiftInstanceCallOutTemplate(
  data: ShiftInstanceCallOutTemplateData,
  context: EmailTemplateContext,
): Promise<{ subject: string; html: string }> {
  const { t } = context;
  const firstName = escapeHtml(data.recipientFirstName);
  const organizationUnitName = escapeHtml(data.organizationUnitName);
  const shiftUrl = shiftPublicUrl(data.shiftId, data.instanceId);
  const brandName = emailTheme.brandName;

  const iconBadge = `<div style="display:inline-block;background-color:${emailTheme.colors.primarySoft};border-radius:9999px;padding:14px;line-height:0;">${emailMegaphoneIcon(
    emailTheme.colors.primary,
    28,
  )}</div>`;

  const body = card(`
    ${text(iconBadge, { align: 'center', padding: '0 0 16px' })}
    ${heading(t('shiftInstanceCallOut.heading'), { color: emailTheme.colors.primary })}
    ${paragraph(
      t('shiftInstanceCallOut.greeting', {
        firstName,
        shiftTitle: escapeHtml(data.shiftTitle),
        organizationName: organizationUnitName,
      }),
      { padding: '0 0 16px' },
    )}
    ${detailTable(buildDetailRows(data, context))}
    ${button({ href: shiftUrl, label: t('shiftInstanceCallOut.buttonLabel') })}
  `);

  const unsubscribeNote = unsubscribeFooterNote(t);

  return renderEmail({
    templateName: 'shiftInstanceCallOutTemplate',
    subject: t('shiftInstanceCallOut.subject', { shiftTitle: data.shiftTitle }),
    previewText: t('shiftInstanceCallOut.previewText', {
      shiftTitle: data.shiftTitle,
      organizationName: data.organizationUnitName,
    }),
    body,
    footerNote: [
      t('shiftInstanceCallOut.footerNote', { brandName }),
      unsubscribeNote,
    ]
      .filter(Boolean)
      .join('<br />'),
  });
}
