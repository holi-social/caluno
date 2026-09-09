ALTER TABLE "contracts" ADD COLUMN "field_overrides" jsonb DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "field_overrides" jsonb DEFAULT '{}' NOT NULL;