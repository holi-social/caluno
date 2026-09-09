ALTER TYPE "contract_status" ADD VALUE 'DRAFT' BEFORE 'AWAITING_VOLUNTEER_SIGNATURE';--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "field_overrides" jsonb DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "field_overrides" jsonb DEFAULT '{}' NOT NULL;