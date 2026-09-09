CREATE TABLE "volunteer_digest_shift_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" text NOT NULL,
	"shift_id" uuid NOT NULL,
	"instance_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"send_date" timestamp NOT NULL,
	"accepted_count" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_vdsl_user_id" ON "volunteer_digest_shift_logs" ("user_id");--> statement-breakpoint
CREATE INDEX "idx_vdsl_instance_id" ON "volunteer_digest_shift_logs" ("instance_id");--> statement-breakpoint
CREATE INDEX "idx_vdsl_send_date" ON "volunteer_digest_shift_logs" ("send_date");--> statement-breakpoint
ALTER TABLE "volunteer_digest_shift_logs" ADD CONSTRAINT "volunteer_digest_shift_logs_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "volunteer_digest_shift_logs" ADD CONSTRAINT "volunteer_digest_shift_logs_shift_id_shifts_id_fkey" FOREIGN KEY ("shift_id") REFERENCES "shifts"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "volunteer_digest_shift_logs" ADD CONSTRAINT "volunteer_digest_shift_logs_instance_id_shift_instances_id_fkey" FOREIGN KEY ("instance_id") REFERENCES "shift_instances"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "volunteer_digest_shift_logs" ADD CONSTRAINT "volunteer_digest_shift_logs_JEmEZNy2ijpb_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;