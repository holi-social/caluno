ALTER TABLE "memberships" ADD COLUMN "id_verified_at" timestamp;--> statement-breakpoint
ALTER TABLE "memberships" ADD COLUMN "id_verified_by_id" text;--> statement-breakpoint
ALTER TABLE "organization_units" ADD COLUMN "id_verification_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_id_verified_by_id_users_id_fkey" FOREIGN KEY ("id_verified_by_id") REFERENCES "users"("id") ON DELETE SET NULL;