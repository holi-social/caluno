ALTER TABLE "users" ADD COLUMN "email_weekly_update_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_urgent_calls_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_platform_enabled" boolean DEFAULT true NOT NULL;