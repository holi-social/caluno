ALTER TABLE "form_submissions" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "form_submissions" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
DROP TYPE "form_submission_status";--> statement-breakpoint
CREATE TYPE "form_submission_status" AS ENUM('SUBMITTED', 'REJECTED');--> statement-breakpoint
ALTER TABLE "form_submissions" ALTER COLUMN "status" SET DATA TYPE "form_submission_status" USING "status"::"form_submission_status";--> statement-breakpoint
ALTER TABLE "form_submissions" ALTER COLUMN "status" SET DEFAULT 'SUBMITTED'::"form_submission_status";