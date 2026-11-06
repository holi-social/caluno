ALTER TABLE "shifts" DROP CONSTRAINT "shifts_reimbursement_type_id_reimbursement_types_id_fkey";--> statement-breakpoint
ALTER TABLE "shift_instances" DROP CONSTRAINT "shift_instances_vqbeHnPUINmZ_fkey";--> statement-breakpoint
ALTER TABLE "time_entries" DROP CONSTRAINT "time_entries_reimbursement_type_id_reimbursement_types_id_fkey";--> statement-breakpoint
ALTER TABLE "time_entries" DROP CONSTRAINT "chk_time_entries_paid_requires_reimbursement_type";--> statement-breakpoint
DROP INDEX "idx_shifts_reimbursement_type_id";--> statement-breakpoint
ALTER TABLE "organizations" DROP COLUMN "accounting_enabled";--> statement-breakpoint
ALTER TABLE "shifts" DROP COLUMN "reimbursement_type_id";--> statement-breakpoint
ALTER TABLE "shift_instances" DROP COLUMN "override_reimbursement_type_id";--> statement-breakpoint
ALTER TABLE "time_entries" DROP COLUMN "reimbursement_type_id";--> statement-breakpoint
ALTER TABLE "time_entries" DROP COLUMN "is_paid";