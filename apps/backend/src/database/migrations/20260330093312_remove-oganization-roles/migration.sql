ALTER TABLE "roles" DROP CONSTRAINT "roles_organization_id_organizations_id_fkey";--> statement-breakpoint
ALTER TABLE "roles" DROP CONSTRAINT "uq_roles_name_organization_id";--> statement-breakpoint
ALTER TABLE "roles" DROP CONSTRAINT "chk_roles_exactly_one_scope_fk";--> statement-breakpoint
DROP INDEX "idx_roles_organization_id";--> statement-breakpoint
ALTER TABLE "roles" DROP COLUMN "organization_id";