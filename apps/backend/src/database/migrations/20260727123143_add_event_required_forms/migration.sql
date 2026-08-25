CREATE TABLE "event_required_forms" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid,
	"form_id" uuid,
	"order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "pk_event_required_forms" PRIMARY KEY("event_id","form_id")
);
--> statement-breakpoint
ALTER TABLE "event_required_forms" ADD CONSTRAINT "event_required_forms_event_id_events_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "event_required_forms" ADD CONSTRAINT "event_required_forms_form_id_requirement_forms_id_fkey" FOREIGN KEY ("form_id") REFERENCES "requirement_forms"("id") ON DELETE RESTRICT;