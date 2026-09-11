ALTER TABLE "invoice_time_entries" DROP CONSTRAINT "uq_invoice_time_entries_time_entry_id";--> statement-breakpoint
ALTER TABLE "invoice_time_entries" ADD COLUMN "released" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_invoice_time_entries_time_entry_id" ON "invoice_time_entries" ("time_entry_id") WHERE "released" = false;