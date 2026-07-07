import { spawnSync } from 'node:child_process';
import { Client } from 'pg';

export const getTestDatabaseName = (): string => {
  const baseName = process.env.POSTGRES_DB ?? 'clippy';
  if (baseName.endsWith('_test')) {
    return baseName;
  }
  return `${baseName}_test`;
};

export const applyTestDatabaseEnvironment = (): string => {
  process.env.NODE_ENV = 'test';
  process.env.DB_HOST ??= 'localhost';
  process.env.DB_PORT ??= process.env.POSTGRES_PORT ?? '5432';
  process.env.DB_USER ??= process.env.POSTGRES_USER ?? 'postgres';
  process.env.DB_PASSWORD ??= process.env.POSTGRES_PASSWORD ?? 'postgres';

  const testDbName = getTestDatabaseName();
  process.env.DB_NAME = testDbName;
  return testDbName;
};

const getBackendRoot = () => {
  const cwd = process.cwd();
  return cwd.endsWith('apps/backend') ? cwd : `${cwd}/apps/backend`;
};

export const runMigrationsAndSeed = (testDbName: string): void => {
  const backendRoot = getBackendRoot();

  const migrateResult = spawnSync('bun', ['run', 'db:migrate'], {
    cwd: backendRoot,
    stdio: 'inherit',
    env: {
      ...process.env,
      DB_NAME: testDbName,
    },
  });

  if (migrateResult.status !== 0) {
    throw new Error('Failed to migrate test database.');
  }

  const seedResult = spawnSync('bun', ['run', 'src/database/seed.ts'], {
    cwd: backendRoot,
    stdio: 'inherit',
    env: {
      ...process.env,
      DB_NAME: testDbName,
    },
  });

  if (seedResult.status !== 0) {
    throw new Error('Failed to seed test database.');
  }
};

export const ensureTestDatabase = async (): Promise<string> => {
  const testDbName = applyTestDatabaseEnvironment();

  const port = parseInt(process.env.DB_PORT ?? '5432', 10);

  const adminClient = new Client({
    host: process.env.DB_HOST,
    port,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'postgres',
    ssl: false,
  });

  await adminClient.connect();

  try {
    const result = await adminClient.query<{ exists: boolean }>(
      'SELECT EXISTS(SELECT 1 FROM pg_database WHERE datname = $1) AS exists;',
      [testDbName],
    );

    if (!result.rows[0]?.exists) {
      await adminClient.query(`CREATE DATABASE "${testDbName}";`);
      console.log(`Created test database ${testDbName}.`);
    }
  } finally {
    await adminClient.end();
  }

  runMigrationsAndSeed(testDbName);

  return testDbName;
};
