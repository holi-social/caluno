ALTER TABLE "organizations" DROP CONSTRAINT "organizations_owner_id_users_id_fk";--> statement-breakpoint
DROP INDEX "idx_organizations_owner_id";--> statement-breakpoint
ALTER TABLE "memberships" ALTER COLUMN "role" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "memberships" ALTER COLUMN "role" DROP DEFAULT;--> statement-breakpoint
DROP TYPE "organization_role";--> statement-breakpoint
CREATE TYPE "organization_role" AS ENUM('ADMIN', 'VOLUNTEER');--> statement-breakpoint
ALTER TABLE "memberships" ALTER COLUMN "role" SET DATA TYPE "organization_role" USING "role"::"organization_role";--> statement-breakpoint
ALTER TABLE "memberships" ALTER COLUMN "role" SET DEFAULT 'VOLUNTEER'::"organization_role";--> statement-breakpoint
ALTER TABLE "organizations" DROP COLUMN "owner_id";