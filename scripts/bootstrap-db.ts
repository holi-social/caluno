import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BACKEND_ROOT = join(REPO_ROOT, 'apps/backend');

const LOCAL_DB_HOSTS = new Set(['localhost', '127.0.0.1', 'postgres']);

const loadEnvFile = (path: string): void => {
  if (!existsSync(path)) {
    return;
  }

  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const equalsIndex = trimmed.indexOf('=');
    if (equalsIndex === -1) {
      continue;
    }

    const key = trimmed
      .slice(0, equalsIndex)
      .trim()
      .replace(/^export\s+/, '');
    let value = trimmed.slice(equalsIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
};

const applyDatabaseEnvironment = (): void => {
  loadEnvFile(join(REPO_ROOT, '.env'));
  loadEnvFile(join(BACKEND_ROOT, '.env'));

  process.env.DB_HOST ??= 'localhost';
  process.env.DB_PORT ??= process.env.POSTGRES_PORT ?? '5432';
  process.env.DB_USER ??= process.env.POSTGRES_USER ?? 'postgres';
  process.env.DB_PASSWORD ??= process.env.POSTGRES_PASSWORD ?? 'postgres';
  process.env.DB_NAME ??= process.env.POSTGRES_DB ?? 'caluno';
};

const assertLocalDbHost = (): void => {
  const host = process.env.DB_HOST ?? 'localhost';
  if (!LOCAL_DB_HOSTS.has(host)) {
    throw new Error(
      `Refusing to bootstrap: DB_HOST="${host}" is not a local development host. ` +
        `Allowed: ${[...LOCAL_DB_HOSTS].join(', ')}`,
    );
  }
};

const run = (command: string, args: string[], cwd = REPO_ROOT): void => {
  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    env: process.env,
  });

  if (result.status !== 0) {
    throw new Error(`Command failed: ${command} ${args.join(' ')}`);
  }
};

const logFixtureSummary = (): void => {
  console.log('\nPlayground fixtures loaded.');
  console.log('Organization: Playground');
  console.log(
    'Password for all accounts: abcd1234 (override with FIXTURE_PASSWORD)\n',
  );
  console.log('Accounts:');
  console.log('  testing+admin@caluno.org          (Owner)');
  console.log('  testing+supervisor@caluno.org   (Supervisor)');
  console.log(
    '  testing+demo@caluno.org         (Member — use this one for demos)',
  );
  console.log('  testing+001@caluno.org … testing+010@caluno.org (Member)');
  console.log(
    '  testing+pending01@caluno.org, testing+pending02@caluno.org (pending request)',
  );
  console.log('  testing+rejected01@caluno.org   (rejected request)');
  console.log('\nShifts (weekly, Europe/Berlin):');
  console.log(
    '  Community Support   Mon 08:00–12:00  (all members + demo invited)',
  );
  console.log(
    '  Food Distribution   Wed 12:00–16:00  (supervisor + demo + member01–04)',
  );
  console.log(
    '  Event Assistance    Fri 16:00–20:00  (demo + member05–07 invited)',
  );
  console.log(
    '\nRequirement form: Personal Information — block with required First name and Last name.',
  );
  console.log(
    'Demo account also follows the Volunteer Fair event and has 4 more',
  );
  console.log('shifts across the next 3 weeks left to discover.');
};

const main = (): void => {
  applyDatabaseEnvironment();
  assertLocalDbHost();

  console.log('Wiping local Postgres volume…');
  run('docker', ['compose', 'down', '-v'], REPO_ROOT);

  console.log('Starting Postgres…');
  run('bun', ['run', 'db:up'], REPO_ROOT);

  console.log('Running migrations…');
  run('bun', ['run', 'db:migrate'], REPO_ROOT);

  console.log('Seeding permissions…');
  run('bun', ['run', 'src/database/seed.ts'], BACKEND_ROOT);

  console.log('Loading Playground fixtures…');
  run('bun', ['run', 'db:fixtures'], BACKEND_ROOT);

  logFixtureSummary();
};

main();
