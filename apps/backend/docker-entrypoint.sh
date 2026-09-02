#!/bin/sh
set -e

echo "Running database migrations…"
bun run db:migrate

echo "Seeding permissions…"
bun run db:seed

if [ "${RUN_STAGING_FIXTURES}" = "true" ]; then
  echo "Loading staging fixtures…"
  bun run db:fixtures:staging
fi

echo "Starting backend…"
exec bun run start:prod
