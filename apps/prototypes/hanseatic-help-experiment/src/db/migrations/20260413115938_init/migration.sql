CREATE TABLE "hanseatic_help_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"action" text NOT NULL,
	"planned_duration_hours" integer,
	"arrival_time" text,
	"break_arrival_time" text,
	"break_departure_time" text,
	"name" text,
	"email" text,
	"gdpr_consent" boolean,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
