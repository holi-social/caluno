CREATE TABLE "shift_recurrence_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"shift_id" uuid NOT NULL CONSTRAINT "uq_shift_recurrence_rules_shift_id" UNIQUE,
	"days_of_week" text[] NOT NULL,
	"ends_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "shifts" ADD COLUMN "max_volunteers" integer;--> statement-breakpoint
CREATE INDEX "idx_shift_recurrence_rules_shift_id" ON "shift_recurrence_rules" ("shift_id");--> statement-breakpoint
ALTER TABLE "shift_recurrence_rules" ADD CONSTRAINT "shift_recurrence_rules_shift_id_shifts_id_fkey" FOREIGN KEY ("shift_id") REFERENCES "shifts"("id") ON DELETE CASCADE;