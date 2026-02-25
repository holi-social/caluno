ALTER TABLE "shifts" RENAME COLUMN "description" TO "instructions";--> statement-breakpoint
ALTER TABLE "shifts" ADD COLUMN "title" text NOT NULL;--> statement-breakpoint
ALTER TABLE "shifts" ADD COLUMN "slug" text NOT NULL;--> statement-breakpoint
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_slug_unique" UNIQUE("slug");