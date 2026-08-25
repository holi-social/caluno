ALTER TABLE "time_entries" ALTER COLUMN "shift_instance_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "time_entries" ALTER COLUMN "organization_unit_id" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_time_entries_open_shiftless_per_org_volunteer" ON "time_entries" ("organization_unit_id","volunteer_id") WHERE "shift_instance_id" IS NULL AND "ended_at" IS NULL;