ALTER TABLE "users" ALTER COLUMN "check_in_id" SET DATA TYPE text USING "check_in_id"::text;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "check_in_id" DROP DEFAULT;

UPDATE "users"
SET check_in_id = LEFT(REPLACE(check_in_id, '-', ''), 12);
