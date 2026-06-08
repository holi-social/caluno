ALTER TABLE "requirement_forms" DROP CONSTRAINT IF EXISTS "uq_requirement_forms_organization_id_slug";--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "form_blocks" ADD CONSTRAINT "uq_form_blocks_organization_id_title" UNIQUE("organization_id","title");
EXCEPTION
	WHEN duplicate_table THEN NULL;
	WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "requirement_forms" ADD CONSTRAINT "uq_requirement_forms_organization_unit_id_name" UNIQUE("organization_unit_id","name");
EXCEPTION
	WHEN duplicate_table THEN NULL;
	WHEN duplicate_object THEN NULL;
END $$;
