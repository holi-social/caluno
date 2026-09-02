CREATE TABLE "form_submission_shares" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"submission_id" uuid NOT NULL,
	"organization_unit_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uq_form_submission_shares_submission_unit" UNIQUE("submission_id","organization_unit_id")
);
--> statement-breakpoint
CREATE INDEX "idx_form_submission_shares_organization_unit_id" ON "form_submission_shares" ("organization_unit_id");--> statement-breakpoint
ALTER TABLE "form_submission_shares" ADD CONSTRAINT "form_submission_shares_submission_id_form_submissions_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "form_submissions"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "form_submission_shares" ADD CONSTRAINT "form_submission_shares_RxvtuRIVaak7_fkey" FOREIGN KEY ("organization_unit_id") REFERENCES "organization_units"("id") ON DELETE CASCADE;