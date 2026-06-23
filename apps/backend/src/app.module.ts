import { join } from 'node:path';
import { ApolloDriver, type ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { GraphQLModule } from '@nestjs/graphql';
import {
  AuthGuard,
  AuthModule as BetterAuthModule,
} from '@thallesp/nestjs-better-auth';
import { betterAuth } from 'better-auth';
import { createAuthConfig } from './auth/auth';
import { AuthModule } from './auth/auth.module';
import { PermissionGuard } from './auth/guards/permission.guard';
import { type Database, DatabaseModule } from './database/database.module';
import { DATABASE_CONNECTION } from './database/database-connection';
import { EventModule } from './event/event.module';
import { GraphqlModule } from './graphql/graphql.module';
import { LoaderInterceptor } from './graphql/interceptors';
import { MembershipModule } from './membership/membership.module';
import { MembershipLifecycleModule } from './membership-lifecycle/membership-lifecycle.module';
import { EmailService } from './notification/email/email.service';
import { accountVerificationOtpTemplate } from './notification/email/templates/account-verification-otp.template';
import { NotificationModule } from './notification/notification.module';
import { OrganizationModule } from './organization/organization.module';
import { RequirementProfileModule } from './requirement-profile/requirement-profile.module';
import { ShiftModule } from './shift/shift.module';
import { TimeTrackingModule } from './time-tracking/time-tracking.module';
import { UserModule } from './user/user.module';

const autoSchemaFile =
  process.env.NODE_ENV === 'test'
    ? true
    : join(process.cwd(), 'src/schema.gql');

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: '.',
      global: true,
    }),
    DatabaseModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile,
      graphiql: true,
      sortSchema: true,
      fieldResolverEnhancers: ['guards'],
      context: ({ req }) => ({
        req,
        user: req.user,
        organizationUnitId: req.headers['x-organization-unit-id'],
      }),
    }),
    BetterAuthModule.forRootAsync({
      imports: [DatabaseModule, ConfigModule, NotificationModule],
      useFactory: (
        database: Database,
        configService: ConfigService,
        emailService: EmailService,
      ) => ({
        auth: betterAuth(
          createAuthConfig({
            database,
            trustedOrigins: [configService.getOrThrow('WEB_URL')],
            cookieDomain: configService.get('COOKIE_DOMAIN'),
            sendVerificationOTP: async ({ email, otp, type }) => {
              // TODO: When enabling OTP sign-in, password reset, or email change,
              // add type-specific templates here instead of sending generic copy.
              if (type !== 'email-verification') {
                return;
              }

              const emailContent = await accountVerificationOtpTemplate({
                otp,
                expiresInMinutes: 5,
              });

              await emailService.send({
                to: email,
                ...emailContent,
              });
            },
          }),
        ),
      }),
      inject: [DATABASE_CONNECTION, ConfigService, EmailService],
    }),
    UserModule,
    OrganizationModule,
    RequirementProfileModule,
    MembershipModule,
    MembershipLifecycleModule,
    NotificationModule,
    TimeTrackingModule,
    GraphqlModule,
    ShiftModule,
    EventModule,
    BetterAuthModule,
    AuthModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LoaderInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionGuard,
    },
  ],
})
export class AppModule {}
