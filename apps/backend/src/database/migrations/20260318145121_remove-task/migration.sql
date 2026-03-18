ALTER TABLE "task_assignments" DROP CONSTRAINT "task_assignments_task_id_tasks_id_fk";--> statement-breakpoint
ALTER TABLE "volunteer_sessions" DROP CONSTRAINT "volunteer_sessions_assignment_id_task_assignments_id_fk";--> statement-breakpoint
DROP TABLE "tasks";--> statement-breakpoint
DROP TABLE "task_assignments";--> statement-breakpoint
ALTER TABLE "volunteer_sessions" DROP COLUMN "assignment_id";--> statement-breakpoint
DROP TYPE "task_status";