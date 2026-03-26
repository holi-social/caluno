ALTER TABLE "shifts" DROP CONSTRAINT "shifts_project_id_projects_id_fk";--> statement-breakpoint
DROP TABLE "projects";--> statement-breakpoint
DROP INDEX "idx_shifts_project_id";--> statement-breakpoint
ALTER TABLE "shifts" DROP COLUMN "project_id";--> statement-breakpoint
DROP TYPE "project_status";