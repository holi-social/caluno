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
  shiftsAdminUrl,
  strong,
} from './shared';

export interface ShiftSeriesVolunteerLeftTemplateData {
  organizationUnitId: string;
  organizationUnitName: string;
  shiftTitle: string;
  shiftLocation?: string | null;
  volunteerName: string;
  recipientFirstName: string;
  fromDate: Date;
  signedUpCount: number;
  minVolunteers: number | null;
}

function coverageLine(
  data: ShiftSeriesVolunteerLeftTemplateData,
  { t }: EmailTemplateContext,
): string {
  const signedUp = String(data.signedUpCount);
  if (data.minVolunteers == null) {
    return t('shiftSeriesVolunteerLeft.coverageNoMin', { signedUp });
  }
  return t('shiftSeriesVolunteerLeft.coverage', {
    signedUp,
    minVolunteers: String(data.minVolunteers),
  });
}

export async function shiftSeriesVolunteerLeftTemplate(
  data: ShiftSeriesVolunteerLeftTemplateData,
  context: EmailTemplateContext,
): Promise<{ subject: string; html: string }> {
  const { t, formatDate } = context;
  const firstName = escapeHtml(data.recipientFirstName);
  const volunteerName = escapeHtml(data.volunteerName);
  const brandName = emailTheme.brandName;
  const shiftsUrl = shiftsAdminUrl(data.organizationUnitId);

  const rows: DetailTableRow[] = [
    {
      kind: 'pair',
      label: t('shiftSeriesVolunteerLeft.detailShift'),
      value: escapeHtml(data.shiftTitle),
    },
    {
      kind: 'pair',
      label: t('shiftSeriesVolunteerLeft.detailOrganization'),
      value: escapeHtml(data.organizationUnitName),
    },
    {
      kind: 'pair',
      label: t('shiftSeriesVolunteerLeft.detailVolunteer'),
      value: volunteerName,
    },
    {
      kind: 'pair',
      label: t('shiftSeriesVolunteerLeft.detailFrom'),
      value: escapeHtml(formatDate(data.fromDate)),
    },
  ];

  if (data.shiftLocation) {
    rows.push({
      kind: 'pair',
      label: t('shiftSeriesVolunteerLeft.detailLocation'),
      value: escapeHtml(data.shiftLocation),
    });
  }

  const body = card(`
    ${heading(t('shiftSeriesVolunteerLeft.heading'))}
    ${paragraph(
      t('shiftSeriesVolunteerLeft.greeting', { firstName, volunteerName }),
      {
        padding: '0 0 16px',
      },
    )}
    ${detailTable(rows)}
    ${paragraph(`${strong(coverageLine(data, context))}`, {
      padding: '0 0 16px',
    })}
    ${button({ href: shiftsUrl, label: t('shiftSeriesVolunteerLeft.buttonLabel') })}
    ${divider()}
    ${note(t('shiftSeriesVolunteerLeft.note'))}
  `);

  return renderEmail({
    templateName: 'shiftSeriesVolunteerLeftTemplate',
    subject: t('shiftSeriesVolunteerLeft.subject', {
      volunteerName,
      shiftTitle: data.shiftTitle,
    }),
    previewText: t('shiftSeriesVolunteerLeft.previewText', {
      volunteerName: data.volunteerName,
      shiftTitle: data.shiftTitle,
      organizationName: data.organizationUnitName,
    }),
    body,
    footerNote: t('shiftSeriesVolunteerLeft.footerNote', { brandName }),
  });
}
