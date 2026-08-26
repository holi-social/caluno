CREATE TABLE "reimbursement_bundle_downloads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"volunteer_id" text NOT NULL,
	"reimbursement_type_id" uuid NOT NULL,
	"downloaded_at" timestamp NOT NULL,
	"downloaded_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "uq_reimbursement_bundle_downloads_volunteer_type" ON "reimbursement_bundle_downloads" ("volunteer_id","reimbursement_type_id");--> statement-breakpoint
ALTER TABLE "reimbursement_bundle_downloads" ADD CONSTRAINT "reimbursement_bundle_downloads_volunteer_id_users_id_fkey" FOREIGN KEY ("volunteer_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "reimbursement_bundle_downloads" ADD CONSTRAINT "reimbursement_bundle_downloads_wYr9Yo32WOYe_fkey" FOREIGN KEY ("reimbursement_type_id") REFERENCES "reimbursement_types"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "reimbursement_bundle_downloads" ADD CONSTRAINT "reimbursement_bundle_downloads_UssWxAIn1SKo_fkey" FOREIGN KEY ("downloaded_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL;