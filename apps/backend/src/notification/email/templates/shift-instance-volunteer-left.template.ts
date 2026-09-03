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

export interface ShiftInstanceVolunteerLeftTemplateData {
  organizationUnitId: string;
  organizationUnitName: string;
  shiftTitle: string;
  shiftLocation?: string | null;
  volunteerName: string;
  recipientFirstName: string;
  startsAt: Date;
  endsAt: Date;
  signedUpCount: number;
  minVolunteers: number | null;
}

function coverageLine(
  data: ShiftInstanceVolunteerLeftTemplateData,
  { t }: EmailTemplateContext,
): string {
  const signedUp = String(data.signedUpCount);
  if (data.minVolunteers == null) {
    return t('shiftInstanceVolunteerLeft.coverageNoMin', { signedUp });
  }
  return t('shiftInstanceVolunteerLeft.coverage', {
    signedUp,
    minVolunteers: String(data.minVolunteers),
  });
}

export async function shiftInstanceVolunteerLeftTemplate(
  data: ShiftInstanceVolunteerLeftTemplateData,
  context: EmailTemplateContext,
): Promise<{ subject: string; html: string }> {
  const { t, formatDate, formatTime } = context;
  const firstName = escapeHtml(data.recipientFirstName);
  const volunteerName = escapeHtml(data.volunteerName);
  const brandName = emailTheme.brandName;
  const shiftsUrl = shiftsAdminUrl(data.organizationUnitId);

  const rows: DetailTableRow[] = [
    {
      kind: 'pair',
      label: t('shiftInstanceVolunteerLeft.detailShift'),
      value: escapeHtml(data.shiftTitle),
    },
    {
      kind: 'pair',
      label: t('shiftInstanceVolunteerLeft.detailOrganization'),
      value: escapeHtml(data.organizationUnitName),
    },
    {
      kind: 'pair',
      label: t('shiftInstanceVolunteerLeft.detailVolunteer'),
      value: volunteerName,
    },
    {
      kind: 'pair',
      label: t('shiftInstanceVolunteerLeft.detailWhen'),
      value: escapeHtml(
        t('shiftInstanceVolunteerLeft.whenRange', {
          date: formatDate(data.startsAt),
          timeRange: `${formatTime(data.startsAt)} – ${formatTime(data.endsAt)}`,
        }),
      ),
    },
  ];

  if (data.shiftLocation) {
    rows.push({
      kind: 'pair',
      label: t('shiftInstanceVolunteerLeft.detailLocation'),
      value: escapeHtml(data.shiftLocation),
    });
  }

  const body = card(`
    ${heading(t('shiftInstanceVolunteerLeft.heading'))}
    ${paragraph(
      t('shiftInstanceVolunteerLeft.greeting', { firstName, volunteerName }),
      {
        padding: '0 0 16px',
      },
    )}
    ${detailTable(rows)}
    ${paragraph(`${strong(coverageLine(data, context))}`, {
      padding: '0 0 16px',
    })}
    ${button({ href: shiftsUrl, label: t('shiftInstanceVolunteerLeft.buttonLabel') })}
    ${divider()}
    ${note(t('shiftInstanceVolunteerLeft.note'))}
  `);

  return renderEmail({
    templateName: 'shiftInstanceVolunteerLeftTemplate',
    subject: t('shiftInstanceVolunteerLeft.subject', {
      volunteerName,
      shiftTitle: data.shiftTitle,
    }),
    previewText: t('shiftInstanceVolunteerLeft.previewText', {
      volunteerName: data.volunteerName,
      shiftTitle: data.shiftTitle,
      organizationName: data.organizationUnitName,
    }),
    body,
    footerNote: t('shiftInstanceVolunteerLeft.footerNote', { brandName }),
  });
}
