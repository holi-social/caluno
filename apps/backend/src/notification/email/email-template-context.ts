import type { Locale } from '../../graphql/locale';
import type { AppI18nService } from '../../i18n/app-i18n.service';
import type { EmailTemplateContext } from '../../i18n/email-translate';
import { formatLocaleDateTime } from '../../i18n/format-date-time';

const EMAIL_NAMESPACE = 'email';

export function createEmailTemplateContext(
  appI18n: AppI18nService,
  locale: Locale,
): EmailTemplateContext {
  const { t } = appI18n.createTranslator(locale, EMAIL_NAMESPACE);

  return {
    t,
    formatDateTime: (date) => formatLocaleDateTime(date, locale),
  };
}
