ALTER TABLE "time_entries" DROP CONSTRAINT "time_entries_session_id_volunteer_sessions_id_fk";--> statement-breakpoint
DROP TABLE "volunteer_sessions";--> statement-breakpoint
ALTER TABLE "time_entries" DROP COLUMN "session_id";--> statement-breakpoint
DROP TYPE "volunteer_session_status";