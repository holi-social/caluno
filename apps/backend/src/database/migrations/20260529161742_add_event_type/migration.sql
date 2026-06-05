CREATE TYPE "event_invite_status" AS ENUM('PENDING', 'ACCEPTED', 'REJECTED');--> statement-breakpoint
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
CREATE INDEX "idx_event_invites_event_id" ON "event_invites" ("event_id");--> statement-breakpoint
CREATE INDEX "idx_event_invites_user_id" ON "event_invites" ("user_id");--> statement-breakpoint
CREATE INDEX "idx_event_invites_status" ON "event_invites" ("status");--> statement-breakpoint
ALTER TABLE "event_invites" ADD CONSTRAINT "event_invites_event_id_events_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "event_invites" ADD CONSTRAINT "event_invites_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT;