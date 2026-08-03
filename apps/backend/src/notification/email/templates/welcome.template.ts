import type { EmailTemplateContext } from '../../../i18n/email-translate';
import {
  button,
  card,
  createOrganizationUrl,
  divider,
  emailTheme,
  escapeHtml,
  heading,
  note,
  paragraph,
  renderEmail,
} from './shared';

export interface WelcomeTemplateData {
  recipientFirstName: string;
}

export async function welcomeTemplate(
  data: WelcomeTemplateData,
  { t }: EmailTemplateContext,
): Promise<{ subject: string; html: string }> {
  const firstName = escapeHtml(data.recipientFirstName);
  const brandName = emailTheme.brandName;
  const createOrganizationLink = createOrganizationUrl();

  const body = card(`
    ${heading(t('welcome.heading'))}
    ${paragraph(t('welcome.greeting', { firstName, brandName }))}
    ${paragraph(t('welcome.intro', { brandName }))}
    ${button({
      href: createOrganizationLink,
      label: t('welcome.buttonLabel'),
    })}
    ${divider()}
    ${note(t('welcome.note', { brandName }))}
  `);

  return renderEmail({
    templateName: 'welcomeTemplate',
    subject: t('welcome.subject', { brandName }),
    previewText: t('welcome.previewText', { brandName }),
    body,
    footerNote: t('welcome.footerNote', { brandName }),
  });
}
