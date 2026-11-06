import {
  Inject,
  Injectable,
  Logger,
  Module,
  type OnModuleDestroy,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { DATABASE_CONNECTION, DATABASE_POOL } from './database-connection';
import { relations } from './relations';

export type Database = NodePgDatabase<typeof relations>;

@Injectable()
class DatabasePoolLifecycle implements OnModuleDestroy {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: DATABASE_POOL,
      useFactory: (configService: ConfigService): Pool => {
        const logger = new Logger('DatabasePool');
        const pool = new Pool({
          host: configService.getOrThrow('DB_HOST'),
          port: parseInt(configService.getOrThrow('DB_PORT'), 10),
          user: configService.getOrThrow('DB_USER'),
          password: configService.getOrThrow('DB_PASSWORD'),
          database: configService.getOrThrow('DB_NAME'),
          ssl: false,
          max: parseInt(configService.get('DB_POOL_MAX') ?? '25', 10),
          idleTimeoutMillis: parseInt(
            configService.get('DB_POOL_IDLE_TIMEOUT_MS') ?? '120000',
            10,
          ),
          keepAlive: true,
        });
        // node-pg requires an 'error' listener on the pool; otherwise idle-client
        // fatals (backend restart / test DROP DATABASE terminate) become uncaught.
        pool.on('error', (error: Error) => {
          logger.warn(`Idle database pool client error: ${error.message}`);
        });
        return pool;
      },
      inject: [ConfigService],
    },
    {
      provide: DATABASE_CONNECTION,
      useFactory: (pool: Pool): Database =>
        drizzle({
          client: pool,
          relations,
        }),
      inject: [DATABASE_POOL],
    },
    DatabasePoolLifecycle,
  ],
  exports: [DATABASE_CONNECTION],
})
export class DatabaseModule {}
