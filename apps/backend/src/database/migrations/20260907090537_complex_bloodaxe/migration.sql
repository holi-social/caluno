CREATE TYPE "shift_call_out_delivery_status" AS ENUM('SENT', 'FAILED');--> statement-breakpoint
CREATE TABLE "shift_call_out_recipients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"instance_id" uuid NOT NULL,
	"recipient_id" text NOT NULL,
	"sent_by_id" text NOT NULL,
	"status" "shift_call_out_delivery_status" NOT NULL,
	"sent_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_scor_instance_id" ON "shift_call_out_recipients" ("instance_id");--> statement-breakpoint
CREATE INDEX "idx_scor_recipient_id" ON "shift_call_out_recipients" ("recipient_id");--> statement-breakpoint
CREATE INDEX "idx_scor_sent_by_id" ON "shift_call_out_recipients" ("sent_by_id");--> statement-breakpoint
CREATE INDEX "idx_scor_sent_at" ON "shift_call_out_recipients" ("sent_at");--> statement-breakpoint
ALTER TABLE "shift_call_out_recipients" ADD CONSTRAINT "shift_call_out_recipients_instance_id_shift_instances_id_fkey" FOREIGN KEY ("instance_id") REFERENCES "shift_instances"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "shift_call_out_recipients" ADD CONSTRAINT "shift_call_out_recipients_recipient_id_users_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "users"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "shift_call_out_recipients" ADD CONSTRAINT "shift_call_out_recipients_sent_by_id_users_id_fkey" FOREIGN KEY ("sent_by_id") REFERENCES "users"("id") ON DELETE RESTRICT;