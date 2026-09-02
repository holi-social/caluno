ALTER TABLE "form_submissions" DROP CONSTRAINT "form_submissions_membership_id_memberships_id_fkey";--> statement-breakpoint
DROP INDEX "idx_form_submissions_membership_id";--> statement-breakpoint
ALTER TABLE "form_submissions" DROP COLUMN "membership_id";