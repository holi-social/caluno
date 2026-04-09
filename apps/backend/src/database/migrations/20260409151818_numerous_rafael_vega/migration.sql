CREATE TABLE "shift_instances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"master_id" uuid NOT NULL,
	"actual_starts_at" timestamp NOT NULL,
	"actual_ends_at" timestamp NOT NULL,
	"override_title" text,
	"override_instructions" text,
	"override_location" text,
	"override_max_volunteers" integer,
	"is_exception" boolean DEFAULT false NOT NULL,
	"is_cancelled" boolean DEFAULT false NOT NULL,
	"occurrence_index" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shift_instance_invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"instance_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"status" "shift_invite_status" DEFAULT 'PENDING'::"shift_invite_status" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uq_sii_instance_user" UNIQUE("instance_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "time_entries" DROP CONSTRAINT "time_entries_shift_id_shifts_id_fkey";--> statement-breakpoint
DROP TABLE "shift_invites";--> statement-breakpoint
DROP TABLE "shift_recurrence_rules";--> statement-breakpoint
DROP INDEX "idx_shifts_organization_unit_id";--> statement-breakpoint
DROP INDEX "idx_shifts_starts_at";--> statement-breakpoint
DROP INDEX "idx_shifts_ends_at";--> statement-breakpoint
ALTER TABLE "shifts" ADD COLUMN "rrule" text;--> statement-breakpoint
ALTER TABLE "shifts" ADD COLUMN "original_starts_at" timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE "shifts" ADD COLUMN "duration_minutes" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "shifts" ADD COLUMN "is_deleted" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "time_entries" ADD COLUMN "shift_instance_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "shifts" DROP COLUMN "starts_at";--> statement-breakpoint
ALTER TABLE "shifts" DROP COLUMN "ends_at";--> statement-breakpoint
ALTER TABLE "time_entries" DROP COLUMN "shift_id";--> statement-breakpoint
CREATE INDEX "idx_shifts_org_unit_id" ON "shifts" ("organization_unit_id");--> statement-breakpoint
CREATE INDEX "idx_shifts_slug" ON "shifts" ("slug");--> statement-breakpoint
CREATE INDEX "idx_shifts_is_deleted" ON "shifts" ("is_deleted");--> statement-breakpoint
CREATE INDEX "idx_si_master_id" ON "shift_instances" ("master_id");--> statement-breakpoint
CREATE INDEX "idx_si_actual_starts_at" ON "shift_instances" ("actual_starts_at");--> statement-breakpoint
CREATE INDEX "idx_si_actual_ends_at" ON "shift_instances" ("actual_ends_at");--> statement-breakpoint
CREATE INDEX "idx_si_active_range" ON "shift_instances" ("actual_starts_at","actual_ends_at");--> statement-breakpoint
CREATE INDEX "idx_si_is_exception" ON "shift_instances" ("is_exception");--> statement-breakpoint
CREATE INDEX "idx_si_is_cancelled" ON "shift_instances" ("is_cancelled");--> statement-breakpoint
CREATE INDEX "idx_sii_instance_id" ON "shift_instance_invites" ("instance_id");--> statement-breakpoint
CREATE INDEX "idx_sii_user_id" ON "shift_instance_invites" ("user_id");--> statement-breakpoint
CREATE INDEX "idx_sii_status" ON "shift_instance_invites" ("status");--> statement-breakpoint
ALTER TABLE "shift_instances" ADD CONSTRAINT "shift_instances_master_id_shifts_id_fkey" FOREIGN KEY ("master_id") REFERENCES "shifts"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "shift_instance_invites" ADD CONSTRAINT "shift_instance_invites_instance_id_shift_instances_id_fkey" FOREIGN KEY ("instance_id") REFERENCES "shift_instances"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "shift_instance_invites" ADD CONSTRAINT "shift_instance_invites_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_shift_instance_id_shift_instances_id_fkey" FOREIGN KEY ("shift_instance_id") REFERENCES "shift_instances"("id") ON DELETE RESTRICT;