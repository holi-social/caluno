import { Client } from 'pg';
import {
  applyTestDatabaseEnvironment,
  getTestDatabaseName,
  runMigrationsAndSeed,
} from './helpers/ensure-test-database';

const main = async () => {
  applyTestDatabaseEnvironment();
  const testDbName = getTestDatabaseName();

  const port = parseInt(process.env.DB_PORT ?? '5432', 10);

  console.log(`Setting up fresh test database ${testDbName}...`);

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

  runMigrationsAndSeed(testDbName);

  console.log('Test database ready.');
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
