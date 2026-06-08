CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"title" text NOT NULL,
	"slug" text NOT NULL UNIQUE,
	"location" text,
	"logo_url" text,
	"cover_url" text,
	"organization_unit_id" uuid NOT NULL,
	"created_by_id" text NOT NULL,
	"starts_at" timestamp NOT NULL,
	"ends_at" timestamp NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_events_org_unit_id" ON "events" ("organization_unit_id");--> statement-breakpoint
CREATE INDEX "idx_events_created_by_id" ON "events" ("created_by_id");--> statement-breakpoint
CREATE INDEX "idx_events_slug" ON "events" ("slug");--> statement-breakpoint
CREATE INDEX "idx_events_is_deleted" ON "events" ("is_deleted");--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_organization_unit_id_organization_units_id_fkey" FOREIGN KEY ("organization_unit_id") REFERENCES "organization_units"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_created_by_id_users_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT;