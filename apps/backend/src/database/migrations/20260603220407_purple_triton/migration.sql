-- Drop old org-level slug uniqueness on forms
ALTER TABLE "requirement_forms" DROP CONSTRAINT IF EXISTS "uq_requirement_forms_organization_id_slug";

-- Add per-org-unit name uniqueness on forms
ALTER TABLE "requirement_forms" ADD CONSTRAINT "uq_requirement_forms_organization_unit_id_name" UNIQUE ("organization_unit_id", "name");

-- Add per-org title uniqueness on blocks
ALTER TABLE "form_blocks" ADD CONSTRAINT "uq_form_blocks_organization_id_title" UNIQUE ("organization_id", "title");
