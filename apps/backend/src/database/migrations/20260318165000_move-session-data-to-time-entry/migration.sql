DELETE FROM "time_entries";

ALTER TABLE "time_entries" ADD COLUMN "shift_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "time_entries" ADD COLUMN "volunteer_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "time_entries" ALTER COLUMN "ended_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_shift_id_shifts_id_fkey" FOREIGN KEY ("shift_id") REFERENCES "shifts"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_volunteer_id_users_id_fkey" FOREIGN KEY ("volunteer_id") REFERENCES "users"("id") ON DELETE RESTRICT;
