CREATE TYPE "event_invite_status" AS ENUM('PENDING', 'ACCEPTED', 'REJECTED');--> statement-breakpoint
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
CREATE TABLE "event_invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"event_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"status" "event_invite_status" DEFAULT 'PENDING'::"event_invite_status" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uq_event_invites_event_user" UNIQUE("event_id","user_id")
);
--> statement-breakpoint
CREATE INDEX "idx_events_org_unit_id" ON "events" ("organization_unit_id");--> statement-breakpoint
CREATE INDEX "idx_events_created_by_id" ON "events" ("created_by_id");--> statement-breakpoint
CREATE INDEX "idx_events_slug" ON "events" ("slug");--> statement-breakpoint
CREATE INDEX "idx_events_is_deleted" ON "events" ("is_deleted");--> statement-breakpoint
CREATE INDEX "idx_event_invites_event_id" ON "event_invites" ("event_id");--> statement-breakpoint
CREATE INDEX "idx_event_invites_user_id" ON "event_invites" ("user_id");--> statement-breakpoint
CREATE INDEX "idx_event_invites_status" ON "event_invites" ("status");--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_organization_unit_id_organization_units_id_fkey" FOREIGN KEY ("organization_unit_id") REFERENCES "organization_units"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_created_by_id_users_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "event_invites" ADD CONSTRAINT "event_invites_event_id_events_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "event_invites" ADD CONSTRAINT "event_invites_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT;