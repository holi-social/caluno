ALTER TYPE "membership_request_status" ADD VALUE 'CANCELLED';--> statement-breakpoint
ALTER TABLE "membership_requests" DROP CONSTRAINT "uq_memberships_requests_email_organization_id";--> statement-breakpoint
DROP INDEX "idx_membership_requests_email";--> statement-breakpoint
DROP INDEX "idx_memberships_requests_organization_id";--> statement-breakpoint
ALTER TABLE "membership_requests" ADD COLUMN "user_id" text;--> statement-breakpoint
ALTER TABLE "membership_requests" ADD COLUMN "reviewed_by_user_id" text;--> statement-breakpoint
ALTER TABLE "membership_requests" ADD COLUMN "reviewed_at" timestamp;--> statement-breakpoint
ALTER TABLE "membership_requests" ADD COLUMN "rejection_reason" text;--> statement-breakpoint
ALTER TABLE "membership_requests" DROP COLUMN "email";--> statement-breakpoint
ALTER TABLE "membership_requests" ADD CONSTRAINT "uq_membership_requests_user_id_organization_id" UNIQUE("user_id","organization_id");--> statement-breakpoint
CREATE INDEX "idx_membership_requests_user_id" ON "membership_requests" ("user_id");--> statement-breakpoint
CREATE INDEX "idx_membership_requests_organization_id" ON "membership_requests" ("organization_id");--> statement-breakpoint
ALTER TABLE "membership_requests" ADD CONSTRAINT "membership_requests_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "membership_requests" ADD CONSTRAINT "membership_requests_reviewed_by_user_id_users_id_fkey" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "users"("id") ON DELETE CASCADE;