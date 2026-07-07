import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { DATABASE_CONNECTION } from './database-connection';
import { relations } from './relations';

export type Database = NodePgDatabase<typeof relations>;

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: DATABASE_CONNECTION,
      useFactory: (configService: ConfigService): Database => {
        const pool = new Pool({
          host: configService.getOrThrow('DB_HOST'),
          port: parseInt(configService.getOrThrow('DB_PORT'), 10),
          user: configService.getOrThrow('DB_USER'),
          password: configService.getOrThrow('DB_PASSWORD'),
          database: configService.getOrThrow('DB_NAME'),
          ssl: false,
        });
        const db = drizzle({
          client: pool,
          relations,
        });
        return db;
      },
      inject: [ConfigService],
    },
  ],
  exports: [DATABASE_CONNECTION],
})
export class DatabaseModule {}
