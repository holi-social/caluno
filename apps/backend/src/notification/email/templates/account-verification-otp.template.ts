import {
  card,
  divider,
  emailTheme,
  escapeHtml,
  heading,
  note,
  paragraph,
  renderEmail,
  strong,
  text,
} from './shared';

export interface AccountVerificationOtpTemplateData {
  otp: string;
  expiresInMinutes: number;
}

export async function accountVerificationOtpTemplate(
  data: AccountVerificationOtpTemplateData,
): Promise<{ subject: string; html: string }> {
  const otp = escapeHtml(data.otp);
  const expiresInMinutes = escapeHtml(String(data.expiresInMinutes));

  const body = card(`
    ${heading('Verify your email')}
    ${paragraph(
      `Use this code to verify your ${emailTheme.brandName} account email address.`,
    )}
    ${text(otp, {
      size: '32px',
      weight: 700,
      color: emailTheme.colors.greenDark,
      align: 'center',
      padding: '8px 0 20px',
      letterSpacing: '0.16em',
      lineHeight: '1',
    })}
    ${paragraph(`This code expires in ${strong(`${expiresInMinutes} minutes`)}.`)}
    ${divider()}
    ${note('If you did not create an account, you can ignore this email.')}
  `);

  return renderEmail({
    templateName: 'accountVerificationOtpTemplate',
    subject: `Your ${emailTheme.brandName} verification code`,
    previewText: `Your ${emailTheme.brandName} verification code is ${otp}.`,
    body,
    footerNote: `You are receiving this because this email was used to create an account on ${emailTheme.brandName}.`,
  });
}
