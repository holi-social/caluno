import type { EmailTemplateContext } from '../../../i18n/email-translate';
import {
  button,
  card,
  createOrganizationUrl,
  divider,
  emailTheme,
  escapeHtml,
  heading,
  orderedListItem,
  paragraph,
  renderEmail,
  strong,
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
    ${heading(t('welcome.heading', { brandName }))}
    ${paragraph(t('welcome.greeting', { firstName }))}
    ${paragraph(t('welcome.intro', { brandName }))}
    ${paragraph(t('welcome.description', { brandName }))}
    ${paragraph(`${strong(t('welcome.nextStep'))} ${t('welcome.nextStepDetail')}`)}
    ${button({
      href: createOrganizationLink,
      label: t('welcome.buttonLabel'),
    })}
    ${divider()}
    ${paragraph(t('welcome.notSureHeading'))}
    ${orderedListItem(1, t('welcome.step1'))}
    ${orderedListItem(2, t('welcome.step2'))}
    ${orderedListItem(3, t('welcome.step3'), { last: true })}
    ${paragraph(t('welcome.closing'))}
    ${paragraph(t('welcome.excited'))}
  `);

  return renderEmail({
    templateName: 'welcomeTemplate',
    subject: t('welcome.subject', { brandName }),
    previewText: t('welcome.previewText', { brandName }),
    body,
    footerNote: t('welcome.footerNote', { brandName }),
  });
}
