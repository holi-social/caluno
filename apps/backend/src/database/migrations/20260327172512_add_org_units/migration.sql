CREATE TABLE "organization_units" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid NOT NULL,
	"parent_id" uuid,
	"type_id" uuid NOT NULL,
	"is_root" boolean DEFAULT false NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL UNIQUE,
	"logo_url" text,
	"website_url" text,
	"email" text,
	"phone" text,
	"description" text,
	"address" text,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uq_organization_units_organization_id_slug" UNIQUE("organization_id","slug"),
	CONSTRAINT "uq_organization_units_organization_id_id" UNIQUE("organization_id","id"),
	CONSTRAINT "chk_organization_units_root_parent_consistency" CHECK ((
        ("is_root" = true AND "parent_id" IS NULL)
        OR
        ("is_root" = false AND "parent_id" IS NOT NULL)
      )),
	CONSTRAINT "chk_organization_units_not_self_parent" CHECK ("parent_id" IS NULL OR "parent_id" <> "id")
);
--> statement-breakpoint
CREATE TABLE "organization_unit_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"description" text,
	"icon" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "membership_requests" DROP CONSTRAINT IF EXISTS "membership_requests_organization_id_organizations_id_fkey";--> statement-breakpoint
ALTER TABLE "shifts" DROP CONSTRAINT IF EXISTS "shifts_organization_id_organizations_id_fk";--> statement-breakpoint
ALTER TABLE "shifts" DROP CONSTRAINT IF EXISTS "shifts_project_id_projects_id_fk";--> statement-breakpoint
ALTER TABLE "memberships" DROP CONSTRAINT IF EXISTS "memberships_organization_id_organizations_id_fk";--> statement-breakpoint
ALTER TABLE "organizations" DROP CONSTRAINT IF EXISTS "organizations_parent_id_organizations_id_fk";--> statement-breakpoint
DROP TABLE IF EXISTS "projects";--> statement-breakpoint
ALTER TABLE "membership_requests" DROP CONSTRAINT IF EXISTS "uq_membership_requests_user_id_organization_id";--> statement-breakpoint
ALTER TABLE "memberships" DROP CONSTRAINT IF EXISTS "uq_memberships_user_id_organization_id";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_roles_name";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_memberships_organization_id";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_membership_requests_organization_id";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_shifts_organization_id";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_shifts_project_id";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_organizations_parent_id";--> statement-breakpoint
ALTER TABLE "roles" ADD COLUMN "organization_unit_id" uuid;--> statement-breakpoint
ALTER TABLE "membership_requests" ADD COLUMN "organization_unit_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "shifts" ADD COLUMN "organization_unit_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "membership_requests" DROP COLUMN IF EXISTS "organization_id";--> statement-breakpoint
ALTER TABLE "shifts" DROP COLUMN IF EXISTS "organization_id";--> statement-breakpoint
ALTER TABLE "shifts" DROP COLUMN IF EXISTS "project_id";--> statement-breakpoint
ALTER TABLE "memberships" DROP COLUMN IF EXISTS "organization_id";--> statement-breakpoint
ALTER TABLE "organizations" DROP COLUMN IF EXISTS "parent_id";--> statement-breakpoint
ALTER TABLE "roles" ALTER COLUMN "organization_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "roles" ADD CONSTRAINT "uq_roles_name_organization_unit_id" UNIQUE("name","organization_unit_id");--> statement-breakpoint
ALTER TABLE "roles" ADD CONSTRAINT "uq_roles_name_organization_id" UNIQUE("name","organization_id");--> statement-breakpoint
ALTER TABLE "membership_requests" ADD CONSTRAINT "uq_membership_requests_user_id_organization_unit_id" UNIQUE("user_id","organization_unit_id");--> statement-breakpoint
CREATE INDEX "idx_roles_organization_unit_id" ON "roles" ("organization_unit_id");--> statement-breakpoint
CREATE INDEX "idx_memberships_role_id" ON "memberships" ("role_id");--> statement-breakpoint
CREATE INDEX "idx_membership_requests_organization_unit_id" ON "membership_requests" ("organization_unit_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_organization_units_organization_id_is_root_true" ON "organization_units" ("organization_id") WHERE "is_root" = true;--> statement-breakpoint
CREATE INDEX "idx_organization_units_parent_id" ON "organization_units" ("parent_id");--> statement-breakpoint
CREATE INDEX "idx_organization_units_type_id" ON "organization_units" ("type_id");--> statement-breakpoint
CREATE INDEX "idx_organization_units_name" ON "organization_units" ("name");--> statement-breakpoint
CREATE INDEX "idx_organization_units_deleted_at" ON "organization_units" ("deleted_at");--> statement-breakpoint
CREATE INDEX "idx_organization_unit_types_name" ON "organization_unit_types" ("name");--> statement-breakpoint
CREATE INDEX "idx_shifts_organization_unit_id" ON "shifts" ("organization_unit_id");--> statement-breakpoint
ALTER TABLE "roles" ADD CONSTRAINT "roles_organization_unit_id_organization_units_id_fkey" FOREIGN KEY ("organization_unit_id") REFERENCES "organization_units"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "membership_requests" ADD CONSTRAINT "membership_requests_JnW42Hb2WNYu_fkey" FOREIGN KEY ("organization_unit_id") REFERENCES "organization_units"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "organization_units" ADD CONSTRAINT "organization_units_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "organization_units" ADD CONSTRAINT "organization_units_parent_id_organization_units_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "organization_units"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "organization_units" ADD CONSTRAINT "organization_units_type_id_organization_unit_types_id_fkey" FOREIGN KEY ("type_id") REFERENCES "organization_unit_types"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "organization_units" ADD CONSTRAINT "fk_organization_units_parent_same_organization" FOREIGN KEY ("organization_id","parent_id") REFERENCES "organization_units"("organization_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_organization_unit_id_organization_units_id_fkey" FOREIGN KEY ("organization_unit_id") REFERENCES "organization_units"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "roles" DROP CONSTRAINT "roles_organization_id_organizations_id_fkey", ADD CONSTRAINT "roles_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "roles" ADD CONSTRAINT "chk_roles_exactly_one_scope_fk" CHECK ((
        ("organization_id" IS NOT NULL AND "organization_unit_id" IS NULL)
        OR
        ("organization_id" IS NULL AND "organization_unit_id" IS NOT NULL)
      ));--> statement-breakpoint
DROP TYPE IF EXISTS "project_status";