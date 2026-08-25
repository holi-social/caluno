ALTER TABLE "shifts" ADD COLUMN "event_id" uuid;--> statement-breakpoint
CREATE INDEX "idx_shifts_event_id" ON "shifts" ("event_id");--> statement-breakpoint
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_event_id_events_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE SET NULL;