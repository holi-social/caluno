import type { EmailTemplateContext } from '../../../i18n/email-translate';
import {
  card,
  divider,
  emailTheme,
  escapeHtml,
  heading,
  note,
  paragraph,
  renderEmail,
  text,
} from './shared';

export interface AccountVerificationOtpTemplateData {
  otp: string;
  expiresInMinutes: number;
}

export async function accountVerificationOtpTemplate(
  data: AccountVerificationOtpTemplateData,
  { t }: EmailTemplateContext,
): Promise<{ subject: string; html: string }> {
  const otp = escapeHtml(data.otp);
  const expiresInMinutes = data.expiresInMinutes;
  const brandName = emailTheme.brandName;

  const body = card(`
    ${heading(t('accountVerificationOtp.heading'))}
    ${paragraph(t('accountVerificationOtp.intro', { brandName }))}
    ${text(otp, {
      size: '32px',
      weight: 700,
      color: emailTheme.colors.greenDark,
      align: 'center',
      padding: '8px 0 20px',
      letterSpacing: '0.16em',
      lineHeight: '1',
    })}
    ${paragraph(
      t('accountVerificationOtp.expiry', { minutes: expiresInMinutes }),
    )}
    ${divider()}
    ${note(t('accountVerificationOtp.note'))}
  `);

  return renderEmail({
    templateName: 'accountVerificationOtpTemplate',
    subject: t('accountVerificationOtp.subject', { brandName }),
    previewText: t('accountVerificationOtp.previewText', { brandName, otp }),
    body,
    footerNote: t('accountVerificationOtp.footerNote', { brandName }),
  });
}
