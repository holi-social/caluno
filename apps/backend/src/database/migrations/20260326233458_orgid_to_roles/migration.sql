ALTER TABLE "roles" ADD COLUMN "organization_id" uuid;--> statement-breakpoint

UPDATE "roles" SET "organization_id" = (
  SELECT "organization_id" FROM "memberships"
  WHERE "memberships"."role_id" = "roles"."id"
  LIMIT 1
);--> statement-breakpoint

DELETE FROM "roles" WHERE "organization_id" IS NULL;--> statement-breakpoint

ALTER TABLE "roles" ALTER COLUMN "organization_id" SET NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_roles_organization_id" ON "roles" ("organization_id");--> statement-breakpoint
ALTER TABLE "roles" ADD CONSTRAINT "roles_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;
