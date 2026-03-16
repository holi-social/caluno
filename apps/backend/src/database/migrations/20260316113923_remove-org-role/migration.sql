ALTER TABLE "memberships" DROP COLUMN "organization_role";--> statement-breakpoint
ALTER TABLE "memberships" DROP CONSTRAINT "memberships_role_id_roles_id_fkey", ADD CONSTRAINT "memberships_role_id_roles_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT;--> statement-breakpoint
DROP TYPE "organization_role";