import type { EmailTemplateContext } from '../../../i18n/email-translate';
import {
  button,
  card,
  detailItem,
  divider,
  emailTheme,
  escapeHtml,
  heading,
  note,
  paragraph,
  renderEmail,
  shiftInstanceAdminUrl,
} from './shared';

export interface ShiftInstanceJoinRequestedTemplateData {
  organizationUnitId: string;
  organizationUnitName: string;
  shiftId: string;
  shiftTitle: string;
  instanceId: string;
  volunteerName: string;
  recipientFirstName: string;
  startsAt: Date;
}

export async function shiftInstanceJoinRequestedTemplate(
  data: ShiftInstanceJoinRequestedTemplateData,
  { t, formatDateTime }: EmailTemplateContext,
): Promise<{ subject: string; html: string }> {
  const firstName = escapeHtml(data.recipientFirstName);
  const organizationUnitName = escapeHtml(data.organizationUnitName);
  const shiftTitle = escapeHtml(data.shiftTitle);
  const volunteerName = escapeHtml(data.volunteerName);
  const startsAt = escapeHtml(formatDateTime(data.startsAt));
  const instanceUrl = shiftInstanceAdminUrl(
    data.organizationUnitId,
    data.shiftId,
    data.instanceId,
  );
  const brandName = emailTheme.brandName;

  const body = card(`
    ${heading(t('shiftInstanceJoinRequested.heading'))}
    ${paragraph(t('shiftInstanceJoinRequested.greeting', { firstName }), {
      padding: '0 0 20px',
    })}
    ${detailItem(t('shiftInstanceJoinRequested.detailVolunteer'), volunteerName)}
    ${detailItem(t('shiftInstanceJoinRequested.detailShift'), shiftTitle)}
    ${detailItem(t('shiftInstanceJoinRequested.detailOrganization'), organizationUnitName)}
    ${detailItem(t('shiftInstanceJoinRequested.detailStarts'), startsAt, { last: true })}
    ${button({ href: instanceUrl, label: t('shiftInstanceJoinRequested.buttonLabel') })}
    ${divider()}
    ${note(t('shiftInstanceJoinRequested.note'))}
  `);

  return renderEmail({
    templateName: 'shiftInstanceJoinRequestedTemplate',
    subject: t('shiftInstanceJoinRequested.subject', {
      shiftTitle: data.shiftTitle,
      volunteerName: data.volunteerName,
    }),
    previewText: t('shiftInstanceJoinRequested.previewText', {
      volunteerName: data.volunteerName,
      shiftTitle: data.shiftTitle,
      organizationName: data.organizationUnitName,
      startsAt,
    }),
    body,
    footerNote: t('shiftInstanceJoinRequested.footerNote', { brandName }),
  });
}
