import { spawnSync } from 'node:child_process';
import { Client } from 'pg';

const getBackendRoot = () => {
  const cwd = process.cwd();
  return cwd.endsWith('apps/backend') ? cwd : `${cwd}/apps/backend`;
};

const main = async () => {
  process.env.NODE_ENV = 'test';
  process.env.DB_HOST ??= 'localhost';
  process.env.DB_PORT ??= process.env.POSTGRES_PORT ?? '5432';
  process.env.DB_USER ??= process.env.POSTGRES_USER ?? 'postgres';
  process.env.DB_PASSWORD ??= process.env.POSTGRES_PASSWORD ?? 'postgres';
  const testDbName = `${process.env.POSTGRES_DB ?? 'clippy'}_test`;
  process.env.DB_NAME = testDbName;

  const port = parseInt(process.env.DB_PORT, 10);

  console.log(`Setting up test database ${testDbName}...`);

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
    await adminClient.query(`DROP DATABASE IF EXISTS "${testDbName}";`);
    await adminClient.query(`CREATE DATABASE "${testDbName}";`);
    console.log(`Created fresh database ${testDbName}.`);
  } finally {
    await adminClient.end();
  }

  const migrateResult = spawnSync('bun', ['run', 'db:migrate'], {
    cwd: getBackendRoot(),
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
    cwd: getBackendRoot(),
    stdio: 'inherit',
    env: {
      ...process.env,
      DB_NAME: testDbName,
    },
  });

  if (seedResult.status !== 0) {
    throw new Error('Failed to seed test database.');
  }

  console.log('Test database ready.');
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
