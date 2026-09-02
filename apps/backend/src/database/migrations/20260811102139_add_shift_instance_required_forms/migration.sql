CREATE TABLE "shift_instance_required_forms" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"shift_instance_id" uuid,
	"form_id" uuid,
	"order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "pk_shift_instance_required_forms" PRIMARY KEY("shift_instance_id","form_id")
);
--> statement-breakpoint
ALTER TABLE "shift_instance_required_forms" ADD CONSTRAINT "shift_instance_required_forms_F9ZcBCqsk8fB_fkey" FOREIGN KEY ("shift_instance_id") REFERENCES "shift_instances"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "shift_instance_required_forms" ADD CONSTRAINT "shift_instance_required_forms_form_id_requirement_forms_id_fkey" FOREIGN KEY ("form_id") REFERENCES "requirement_forms"("id") ON DELETE RESTRICT;