import { ensureTestDatabase } from './helpers/ensure-test-database';

const main = async () => {
  const testDbName = await ensureTestDatabase();
  console.log(`Test database ready: ${testDbName}`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
