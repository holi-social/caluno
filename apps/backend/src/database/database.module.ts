import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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
      useFactory: (): Database => {
        const host = process.env.DB_HOST;
        const port = process.env.DB_PORT;
        const user = process.env.DB_USER;
        const password = process.env.DB_PASSWORD;
        const database = process.env.DB_NAME;
        if (!host || !port || !user || password == null || !database) {
          throw new Error('Database environment is not fully configured');
        }
        const pool = new Pool({
          host,
          port: parseInt(port, 10),
          user,
          password,
          database,
          ssl: false,
        });
        const db = drizzle({
          client: pool,
          relations,
        });
        return db;
      },
    },
  ],
  exports: [DATABASE_CONNECTION],
})
export class DatabaseModule {}
