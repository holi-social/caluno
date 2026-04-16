UPDATE "requirement_profile_submissions"
SET "submitted_at" = COALESCE("submitted_at", "created_at", now())
WHERE "submitted_at" IS NULL;--> statement-breakpoint

ALTER TABLE "requirement_profile_submissions"
ALTER COLUMN "submitted_at" SET DEFAULT now();--> statement-breakpoint

ALTER TABLE "requirement_profile_submissions"
ALTER COLUMN "submitted_at" SET NOT NULL;--> statement-breakpoint

UPDATE "requirement_fulfillments"
SET "submitted_at" = COALESCE("submitted_at", "created_at", now())
WHERE "submitted_at" IS NULL;--> statement-breakpoint

ALTER TABLE "requirement_fulfillments"
ALTER COLUMN "submitted_at" SET DEFAULT now();--> statement-breakpoint

ALTER TABLE "requirement_fulfillments"
ALTER COLUMN "submitted_at" SET NOT NULL;