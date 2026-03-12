ALTER TABLE "users" ADD COLUMN "check_in_id" uuid DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_check_in_id_key" UNIQUE("check_in_id");