ALTER TYPE "public"."time_session_status" ADD VALUE 'SUBMITTED';--> statement-breakpoint
ALTER TABLE "opportunities" ALTER COLUMN "organization_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "opportunities" ALTER COLUMN "created_by_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "time_sessions" ALTER COLUMN "validated_at" DROP NOT NULL;