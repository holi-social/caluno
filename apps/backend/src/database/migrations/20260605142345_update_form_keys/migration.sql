ALTER TABLE "requirement_forms" DROP CONSTRAINT "uq_requirement_forms_organization_id_slug";--> statement-breakpoint
ALTER TABLE "form_blocks" ADD CONSTRAINT "uq_form_blocks_organization_id_title" UNIQUE("organization_id","title");--> statement-breakpoint
ALTER TABLE "requirement_forms" ADD CONSTRAINT "uq_requirement_forms_organization_unit_id_name" UNIQUE("organization_unit_id","name");