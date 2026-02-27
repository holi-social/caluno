import { join } from 'node:path';
import { ApolloDriver, type ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { GraphQLModule } from '@nestjs/graphql';
import { AuthGuard, AuthModule } from '@thallesp/nestjs-better-auth';
import { betterAuth } from 'better-auth';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { createAuthConfig } from './auth/auth';
import { MembershipRoleGuard } from './auth/guards/membership-role.guard';
import { DatabaseModule } from './database/database.module';
import { DATABASE_CONNECTION } from './database/database-connection';
import { GraphqlModule } from './graphql/graphql.module';
import { MembershipModule } from './membership/membership.module';
import { OrganizationModule } from './organization/organization.module';
import { ProjectModule } from './project/project.module';
import { ShiftModule } from './shift/shift.module';
import { TaskModule } from './task/task.module';
import { TimeTrackingModule } from './time-tracking/time-tracking.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      graphiql: true,
      sortSchema: true,
      context: ({ req }) => ({
        req,
        user: req.user,
        organizationId: req.headers['x-organization-id'],
      }),
    }),
    AuthModule.forRootAsync({
      imports: [DatabaseModule, ConfigModule],
      useFactory: (database: NodePgDatabase, configService: ConfigService) => ({
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
    ProjectModule,
    OrganizationModule,
    MembershipModule,
    TaskModule,
    TimeTrackingModule,
    GraphqlModule,
    ShiftModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: MembershipRoleGuard,
    },
  ],
})
export class AppModule {}
