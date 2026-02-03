CREATE TYPE "public"."shift_visibility" AS ENUM('INVITED_MEMBERS', 'ALL_MEMBERS');--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_username_unique";--> statement-breakpoint
DROP TYPE "public"."organization_role" CASCADE;--> statement-breakpoint
CREATE TYPE "public"."organization_role" AS ENUM('OWNER', 'ADMIN', 'VOLUNTEER');--> statement-breakpoint
ALTER TABLE "shifts" ADD COLUMN "visibility" "shift_visibility" DEFAULT 'ALL_MEMBERS' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "username";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "display_username";