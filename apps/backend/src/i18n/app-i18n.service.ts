import { Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import type { Locale } from '../graphql/locale';

export type TranslateFn = (
  key: string,
  args?: Record<string, string | number>,
) => string;

export interface Translator {
  t: TranslateFn;
}

@Injectable()
export class AppI18nService {
  constructor(private readonly i18n: I18nService) {}

  translate(
    locale: Locale,
    key: string,
    args?: Record<string, string | number>,
  ): string {
    return this.i18n.t(key, { lang: locale, args });
  }

  createTranslator(locale: Locale, namespace: string): Translator {
    const prefix = namespace.endsWith('.') ? namespace : `${namespace}.`;

    return {
      t: (key, args) => this.translate(locale, `${prefix}${key}`, args),
    };
  }
}
