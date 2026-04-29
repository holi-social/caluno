import { join } from 'node:path';
import { ApolloDriver, type ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
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
import { GraphqlModule } from './graphql/graphql.module';
import { LoaderInterceptor } from './graphql/interceptors';
import { MembershipModule } from './membership/membership.module';
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
      imports: [DatabaseModule, ConfigModule],
      useFactory: (database: Database, configService: ConfigService) => ({
        auth: betterAuth(
          createAuthConfig({
            database,
            trustedOrigins: [configService.getOrThrow('WEB_URL')],
            cookieDomain: configService.get('COOKIE_DOMAIN'),
          }),
        ),
      }),
      inject: [DATABASE_CONNECTION, ConfigService],
    }),
    UserModule,
    OrganizationModule,
    RequirementProfileModule,
    MembershipModule,
    NotificationModule,
    TimeTrackingModule,
    GraphqlModule,
    ShiftModule,
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
