import { join } from 'node:path';
import { Test, type TestingModule } from '@nestjs/testing';
import { I18nModule } from 'nestjs-i18n';
import { DEFAULT_LOCALE } from '../graphql/locale';
import { AppI18nService } from './app-i18n.service';
import { formatLocaleDateTime } from './format-date-time';

describe('AppI18nService', () => {
  let moduleRef: TestingModule;
  let appI18n: AppI18nService;

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        I18nModule.forRoot({
          fallbackLanguage: DEFAULT_LOCALE,
          loaderOptions: {
            path: join(__dirname, 'locales'),
          },
        }),
      ],
      providers: [AppI18nService],
    }).compile();

    appI18n = moduleRef.get(AppI18nService);
  });

  afterEach(async () => {
    await moduleRef.close();
  });

  it('translates with a full key path', () => {
    expect(
      appI18n.translate('en', 'email.passwordReset.subject', {
        brandName: 'Clippy',
      }),
    ).toBe('Reset your Clippy password');
  });

  it('scopes translators to a namespace', () => {
    const { t } = appI18n.createTranslator('de', 'email');

    expect(t('passwordReset.subject', { brandName: 'Clippy' })).toBe(
      'Setze dein Clippy-Passwort zurück',
    );
  });
});

describe('formatLocaleDateTime', () => {
  it('formats dates in the recipient locale and Berlin timezone', () => {
    const formatted = formatLocaleDateTime(
      new Date('2026-07-01T10:00:00.000Z'),
      'de',
    );

    expect(formatted).toMatch(/01[./]07[./]2026/);
    expect(formatted).toMatch(/12:00/);
  });
});
