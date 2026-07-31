export const TEST_PASSWORD = 'Test1234!aB';

// Unique per run so each run gets a fresh account.
export const uniqueEmail = () =>
  `e2e+${Date.now()}${Math.floor(Math.random() * 1000)}@example.com`;
