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

export interface ShiftInstanceWaitlistSpotOpenedTemplateData {
  organizationUnitName: string;
  shiftId: string;
  shiftTitle: string;
  shiftLocation?: string | null;
  instanceId: string;
  recipientFirstName: string;
  startsAt: Date;
  endsAt: Date;
}

function buildDetailRows(
  data: ShiftInstanceWaitlistSpotOpenedTemplateData,
  { t, formatDate, formatTime }: EmailTemplateContext,
): DetailTableRow[] {
  const organizationUnitName = escapeHtml(data.organizationUnitName);
  const shiftTitle = escapeHtml(data.shiftTitle);
  const shiftLocation = data.shiftLocation
    ? escapeHtml(data.shiftLocation)
    : null;
  const whenValue = escapeHtml(
    t('shiftInstanceWaitlistSpotOpened.whenRange', {
      date: formatDate(data.startsAt),
      timeRange: `${formatTime(data.startsAt)} – ${formatTime(data.endsAt)}`,
    }),
  );

  const rows: DetailTableRow[] = [
    {
      kind: 'pair',
      label: t('shiftInstanceWaitlistSpotOpened.detailShift'),
      value: shiftTitle,
    },
    {
      kind: 'pair',
      label: t('shiftInstanceWaitlistSpotOpened.detailOrganization'),
      value: organizationUnitName,
    },
    {
      kind: 'pair',
      label: t('shiftInstanceWaitlistSpotOpened.detailWhen'),
      value: whenValue,
    },
  ];

  if (shiftLocation) {
    rows.push({
      kind: 'pair',
      label: t('shiftInstanceWaitlistSpotOpened.detailLocation'),
      value: shiftLocation,
    });
  }

  return rows;
}

export async function shiftInstanceWaitlistSpotOpenedTemplate(
  data: ShiftInstanceWaitlistSpotOpenedTemplateData,
  context: EmailTemplateContext,
): Promise<{ subject: string; html: string }> {
  const { t } = context;
  const firstName = escapeHtml(data.recipientFirstName);
  const claimUrl = shiftPublicUrl(data.shiftId, data.instanceId);
  const brandName = emailTheme.brandName;
  const startsAtText = escapeHtml(context.formatDateTime(data.startsAt));

  const body = card(`
    ${heading(t('shiftInstanceWaitlistSpotOpened.heading'))}
    ${paragraph(
      t('shiftInstanceWaitlistSpotOpened.greeting', { firstName }),
      { padding: '0 0 20px' },
    )}
    ${detailTable(buildDetailRows(data, context))}
    ${button({
      href: claimUrl,
      label: t('shiftInstanceWaitlistSpotOpened.buttonLabel'),
    })}
    ${divider()}
    ${note(t('shiftInstanceWaitlistSpotOpened.note'))}
  `);

  return renderEmail({
    templateName: 'shiftInstanceWaitlistSpotOpenedTemplate',
    subject: t('shiftInstanceWaitlistSpotOpened.subject', {
      shiftTitle: data.shiftTitle,
    }),
    previewText: t('shiftInstanceWaitlistSpotOpened.previewText', {
      shiftTitle: data.shiftTitle,
      organizationName: data.organizationUnitName,
      startsAt: startsAtText,
    }),
    body,
    footerNote: t('shiftInstanceWaitlistSpotOpened.footerNote', { brandName }),
  });
}
