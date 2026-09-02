ALTER TABLE "shifts" ADD COLUMN "reimbursement_type_id" uuid;--> statement-breakpoint
ALTER TABLE "shift_instances" ADD COLUMN "override_reimbursement_type_id" uuid;--> statement-breakpoint
CREATE INDEX "idx_shifts_reimbursement_type_id" ON "shifts" ("reimbursement_type_id");--> statement-breakpoint
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_reimbursement_type_id_reimbursement_types_id_fkey" FOREIGN KEY ("reimbursement_type_id") REFERENCES "reimbursement_types"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "shift_instances" ADD CONSTRAINT "shift_instances_vqbeHnPUINmZ_fkey" FOREIGN KEY ("override_reimbursement_type_id") REFERENCES "reimbursement_types"("id") ON DELETE RESTRICT;