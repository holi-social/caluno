import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { GraphQLModule } from '@nestjs/graphql';
import { AuthGuard, AuthModule } from '@thallesp/nestjs-better-auth';
import { betterAuth } from 'better-auth';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { join } from 'path';
import { createAuthConfig } from './auth/auth';
import { DATABASE_CONNECTION } from './database/database-connection';
import { DatabaseModule } from './database/database.module';
import { GraphqlModule } from './graphql/graphql.module';
import { MembershipModule } from './membership/membership.module';
import { OpportunityModule } from './opportunity/opportunity.module';
import { OrganizationModule } from './organization/organization.module';
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
        }),
        AuthModule.forRootAsync({
            imports: [DatabaseModule, ConfigModule],
            useFactory: (
                database: NodePgDatabase,
                configService: ConfigService,
            ) => ({
                auth: betterAuth(
                    createAuthConfig(database, [
                        configService.getOrThrow('WEB_URL'),
                    ]),
                ),
            }),
            inject: [DATABASE_CONNECTION, ConfigService],
        }),
        UserModule,
        OpportunityModule,
        OrganizationModule,
        MembershipModule,
        TaskModule,
        TimeTrackingModule,
        GraphqlModule,
    ],
    controllers: [],
    providers: [
        {
            provide: APP_GUARD,
            useClass: AuthGuard,
        },
    ],
})
export class AppModule {}
