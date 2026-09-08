CREATE TYPE "shift_call_out_source" AS ENUM('MANUAL', 'AUTOMATIC');--> statement-breakpoint
CREATE TYPE "shift_manager_notification_kind" AS ENUM('CALL_OUT_SUMMARY', 'REMINDER');--> statement-breakpoint
CREATE TABLE "shift_instance_understaffed_states" (
	"instance_id" uuid PRIMARY KEY,
	"last_checked_at" timestamp,
	"call_out_fired_at" timestamp,
	"reminder_fired_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shift_manager_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"instance_id" uuid NOT NULL,
	"recipient_id" text NOT NULL,
	"kind" "shift_manager_notification_kind" NOT NULL,
	"status" "shift_call_out_delivery_status" NOT NULL,
	"sent_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "shift_call_out_recipients" ADD COLUMN "source" "shift_call_out_source" DEFAULT 'MANUAL'::"shift_call_out_source" NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_smn_instance_id" ON "shift_manager_notifications" ("instance_id");--> statement-breakpoint
CREATE INDEX "idx_smn_recipient_id" ON "shift_manager_notifications" ("recipient_id");--> statement-breakpoint
CREATE INDEX "idx_smn_sent_at" ON "shift_manager_notifications" ("sent_at");--> statement-breakpoint
ALTER TABLE "shift_instance_understaffed_states" ADD CONSTRAINT "shift_instance_understaffed_states_BiLthAFNONXn_fkey" FOREIGN KEY ("instance_id") REFERENCES "shift_instances"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "shift_manager_notifications" ADD CONSTRAINT "shift_manager_notifications_instance_id_shift_instances_id_fkey" FOREIGN KEY ("instance_id") REFERENCES "shift_instances"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "shift_manager_notifications" ADD CONSTRAINT "shift_manager_notifications_recipient_id_users_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "users"("id") ON DELETE RESTRICT;

INSERT INTO "users" ("id", "name", "email", "check_in_id")
VALUES ('system-automated', 'Caluno Automated System', 'system-automated@caluno.internal', 'system-automated-checkin')
ON CONFLICT ("id") DO NOTHING;