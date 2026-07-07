import { Global, Module } from '@nestjs/common';
import { I18nModule } from 'nestjs-i18n';
import { DEFAULT_LOCALE } from '../graphql/locale';
import { UserModule } from '../user/user.module';
import { AppI18nService } from './app-i18n.service';
import { resolveI18nLocalesPath } from './resolve-locales-path';
import { UserLocaleService } from './user-locale.service';

@Global()
@Module({
  imports: [
    I18nModule.forRoot({
      fallbackLanguage: DEFAULT_LOCALE,
      loaderOptions: {
        path: resolveI18nLocalesPath(),
        watch: process.env.NODE_ENV !== 'production',
      },
    }),
    UserModule,
  ],
  providers: [AppI18nService, UserLocaleService],
  exports: [AppI18nService, UserLocaleService, I18nModule],
})
export class AppI18nModule {}
