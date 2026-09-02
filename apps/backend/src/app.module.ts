import { join } from 'node:path';
import { ApolloDriver, type ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { GraphQLModule } from '@nestjs/graphql';
import { SentryModule } from '@sentry/nestjs/setup';
import { AuthModule as BetterAuthModule } from '@thallesp/nestjs-better-auth';
import { betterAuth } from 'better-auth';
import { Logger } from 'nestjs-pino';
import { AccountingModule } from './accounting/accounting.module';
import { type BetterAuthLogger, createAuthConfig } from './auth/auth';
import { AuthModule } from './auth/auth.module';
import { PermissionGuard } from './auth/guards/permission.guard';
import { type Database, DatabaseModule } from './database/database.module';
import { DATABASE_CONNECTION } from './database/database-connection';
import { EventModule } from './event/event.module';
import { GraphqlModule } from './graphql/graphql.module';
import { LoaderInterceptor } from './graphql/interceptors';
import { resolveRequestLocale } from './graphql/locale';
import { AppI18nService } from './i18n/app-i18n.service';
import { AppI18nModule } from './i18n/i18n.module';
import { UserLocaleService } from './i18n/user-locale.service';
import { LegalModule } from './legal/legal.module';
import { MembershipModule } from './membership/membership.module';
import { MembershipLifecycleModule } from './membership-lifecycle/membership-lifecycle.module';
import { EmailService } from './notification/email/email.service';
import { createEmailTemplateContext } from './notification/email/email-template-context';
import { accountVerificationOtpTemplate } from './notification/email/templates/account-verification-otp.template';
import { passwordResetTemplate } from './notification/email/templates/password-reset.template';
import { NotificationModule } from './notification/notification.module';
import { OrganizationModule } from './organization/organization.module';
import { RequirementProfileModule } from './requirement-profile/requirement-profile.module';
import { ObservabilityModule } from './shared/observability/observability.module';
import {
  POSTHOG_EVENT,
  POSTHOG_SURFACE,
} from './shared/observability/posthog.events';
import { PostHogService } from './shared/observability/posthog.service';
import { validatePostHogEnv } from './shared/observability/validate-posthog-env';
import { validateSentryEnv } from './shared/observability/validate-sentry-env';
import { ShiftModule } from './shift/shift.module';
import { StorageModule } from './storage/storage.module';
import { TimeTrackingModule } from './time-tracking/time-tracking.module';
import { UserModule } from './user/user.module';
import { UserService } from './user/user.service';

const autoSchemaFile =
  process.env.NODE_ENV === 'test'
    ? true
    : join(process.cwd(), 'src/schema.gql');

@Module({
  imports: [
    SentryModule.forRoot(),
    ObservabilityModule,
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (config) => validatePostHogEnv(validateSentryEnv(config)),
    }),
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: '.',
      global: true,
    }),
    DatabaseModule,
    AppI18nModule,
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [UserModule],
      useFactory: (userService: UserService) => ({
        autoSchemaFile,
        graphiql: true,
        sortSchema: true,
        fieldResolverEnhancers: ['guards'],
        context: async ({ req }) => {
          const user = req.user;
          const locale = user
            ? await userService.resolveLocale(user.id, req.headers)
            : resolveRequestLocale(req.headers);

          return {
            req,
            locale,
            organizationUnitId: req.headers['x-organization-unit-id'],
          };
        },
      }),
      inject: [UserService],
    }),
    BetterAuthModule.forRootAsync({
      imports: [
        DatabaseModule,
        ConfigModule,
        NotificationModule,
        AppI18nModule,
        ObservabilityModule,
      ],
      useFactory: (
        database: Database,
        configService: ConfigService,
        emailService: EmailService,
        userLocaleService: UserLocaleService,
        appI18n: AppI18nService,
        postHogService: PostHogService,
        pinoLogger: Logger,
      ) => {
        const webUrl = configService.getOrThrow<string>('WEB_URL');
        const shouldVerifyEmail = process.env.NODE_ENV === 'production';

        /**
         * Route Better Auth's internal logging (rate-limit warnings, plugin
         * messages, etc.) through the nestjs-pino Logger so it is emitted as
         * structured JSON on stdout instead of a bare console.warn. pino's
         * method names differ from Better Auth's level strings, so map them.
         */
        const betterAuthLogger: BetterAuthLogger = {
          disabled: false,
          // Better Auth writes log level + timestamp + colored labels itself
          // when left to the default logger; we own both today.
          disableColors: true,
          log: (level, message, ...args) => {
            // Bind `context` as a pino field by passing it as the first
            // object argument; trailing args are pino interpolation values.
            const ctx = { context: 'BetterAuth' };
            switch (level) {
              case 'debug':
                pinoLogger.debug(ctx, message, ...args);
                break;
              case 'info':
                pinoLogger.log(ctx, message, ...args);
                break;
              case 'warn':
                pinoLogger.warn(ctx, message, ...args);
                break;
              case 'error':
                pinoLogger.error(ctx, message, ...args);
                break;
            }
          },
        };

        return {
          auth: betterAuth(
            createAuthConfig({
              database,
              trustedOrigins: [webUrl],
              cookieDomain: configService.get('COOKIE_DOMAIN'),
              logger: betterAuthLogger,
              emailVerificationEnabled: shouldVerifyEmail,
              onSessionCreated: (userId) => {
                postHogService.capture({
                  event: POSTHOG_EVENT.USER_LOG_IN,
                  userId,
                  properties: { surface: POSTHOG_SURFACE.AUTH },
                });
              },
              onSessionDeleted: (userId) => {
                postHogService.capture({
                  event: POSTHOG_EVENT.USER_LOG_OUT,
                  userId,
                  properties: { surface: POSTHOG_SURFACE.AUTH },
                });
              },
              onUserCreated: (userId) => {
                postHogService.capture({
                  event: POSTHOG_EVENT.USER_SIGN_UP,
                  userId,
                  properties: { surface: POSTHOG_SURFACE.AUTH },
                });
              },
              sendResetPassword: async ({ email, token, userId, headers }) => {
                const locale = await userLocaleService.resolveForUser(
                  userId,
                  headers,
                );
                const templateContext = createEmailTemplateContext(
                  appI18n,
                  locale,
                );
                const resetUrl = `${webUrl.replace(/\/+$/, '')}/reset-password?token=${encodeURIComponent(token)}`;
                const emailContent = await passwordResetTemplate(
                  {
                    resetUrl,
                    expiresInMinutes: 60,
                  },
                  templateContext,
                );

                await emailService.send({
                  to: email,
                  ...emailContent,
                });
                postHogService.capture({
                  event: POSTHOG_EVENT.PASSWORD_RESET_SEND,
                  userId,
                  properties: { surface: POSTHOG_SURFACE.AUTH },
                });
              },
              sendVerificationOTP: async ({ email, otp, type, headers }) => {
                // TODO: When enabling OTP sign-in or email change,
                // add type-specific templates here instead of sending generic copy.
                if (type !== 'email-verification') {
                  return;
                }

                const locale = await userLocaleService.resolveForEmail(
                  email,
                  headers,
                );
                const templateContext = createEmailTemplateContext(
                  appI18n,
                  locale,
                );
                const emailContent = await accountVerificationOtpTemplate(
                  {
                    otp,
                    expiresInMinutes: 5,
                  },
                  templateContext,
                );

                await emailService.send({
                  to: email,
                  ...emailContent,
                });
                const user = await database.query.users.findFirst({
                  where: { email },
                });
                if (user) {
                  postHogService.capture({
                    event: POSTHOG_EVENT.OTP_SEND,
                    userId: user.id,
                    properties: {
                      surface: POSTHOG_SURFACE.AUTH,
                      source: type,
                    },
                  });
                }
              },
            }),
          ),
        };
      },
      inject: [
        DATABASE_CONNECTION,
        ConfigService,
        EmailService,
        UserLocaleService,
        AppI18nService,
        PostHogService,
        Logger,
      ],
    }),
    UserModule,
    OrganizationModule,
    RequirementProfileModule,
    MembershipModule,
    MembershipLifecycleModule,
    NotificationModule,
    TimeTrackingModule,
    GraphqlModule,
    LegalModule,
    ShiftModule,
    EventModule,
    StorageModule,
    BetterAuthModule,
    AuthModule,
    AccountingModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LoaderInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionGuard,
    },
  ],
})
export class AppModule {}
