import type { PoolConfig } from 'pg';

export type PgConnParts = {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
};

export function requirePgConnParts(): PgConnParts {
  const host = process.env.DB_HOST;
  const database = process.env.DB_NAME;
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const rawPort = process.env.DB_PORT;

  if (!host) {
    throw new Error('DB_HOST is not set');
  }
  if (!database) {
    throw new Error('DB_NAME is not set');
  }
  if (!user) {
    throw new Error('DB_USER is not set');
  }
  if (password === undefined) {
    throw new Error('DB_PASSWORD is not set');
  }

  const port = rawPort ? Number.parseInt(rawPort, 10) : 5432;
  if (Number.isNaN(port)) {
    throw new Error('DB_PORT must be a valid number');
  }

  return { host, port, database, user, password };
}

export function requirePgPoolConfig(): PoolConfig {
  return { ...requirePgConnParts(), ssl: false };
}
