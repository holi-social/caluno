ALTER TABLE "membership_requests" ADD COLUMN "metadata" jsonb;--> statement-breakpoint
ALTER TABLE "organization_units" ADD COLUMN "required_membership_requirement_profile_id" uuid;--> statement-breakpoint
CREATE INDEX "idx_organization_units_required_profile_id" ON "organization_units" ("required_membership_requirement_profile_id");--> statement-breakpoint
ALTER TABLE "organization_units" ADD CONSTRAINT "organization_units_Wl3widDJ46RJ_fkey" FOREIGN KEY ("required_membership_requirement_profile_id") REFERENCES "requirement_profiles"("id") ON DELETE SET NULL;