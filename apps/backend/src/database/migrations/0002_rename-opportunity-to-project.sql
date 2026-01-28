CREATE TYPE "public"."project_status" AS ENUM('DRAFT', 'ACTIVE', 'EXPIRED', 'ARCHIVED');--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"description" text NOT NULL,
	"location" text NOT NULL,
	"organization_id" uuid NOT NULL,
	"created_by_id" text NOT NULL,
	"status" "project_status" DEFAULT 'DRAFT' NOT NULL,
	"starts_at" timestamp NOT NULL,
	"ends_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "projects_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "opportunities" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "opportunities" CASCADE;--> statement-breakpoint
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_opportunity_id_opportunities_id_fk";
--> statement-breakpoint
DROP INDEX "idx_tasks_opportunity_id";--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "project_id" uuid;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_projects_organization_id" ON "projects" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_projects_status" ON "projects" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_projects_title" ON "projects" USING btree ("title");--> statement-breakpoint
CREATE INDEX "idx_projects_starts_at" ON "projects" USING btree ("starts_at");--> statement-breakpoint
CREATE INDEX "idx_projects_ends_at" ON "projects" USING btree ("ends_at");--> statement-breakpoint
CREATE INDEX "idx_projects_created_by_id" ON "projects" USING btree ("created_by_id");--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_tasks_project_id" ON "tasks" USING btree ("project_id");--> statement-breakpoint
ALTER TABLE "tasks" DROP COLUMN "opportunity_id";--> statement-breakpoint
DROP TYPE "public"."opportunity_status";