ALTER TABLE "time_records" RENAME TO "time_entries";--> statement-breakpoint
ALTER TABLE "time_sessions" RENAME TO "volunteer_sessions";--> statement-breakpoint
ALTER TABLE "time_entries" DROP CONSTRAINT "time_records_session_id_time_sessions_id_fk";
--> statement-breakpoint
ALTER TABLE "volunteer_sessions" DROP CONSTRAINT "time_sessions_assignment_id_task_assignments_id_fk";
--> statement-breakpoint
ALTER TABLE "volunteer_sessions" DROP CONSTRAINT "time_sessions_validated_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_session_id_volunteer_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."volunteer_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "volunteer_sessions" ADD CONSTRAINT "volunteer_sessions_assignment_id_task_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."task_assignments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "volunteer_sessions" ADD CONSTRAINT "volunteer_sessions_validated_by_users_id_fk" FOREIGN KEY ("validated_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;