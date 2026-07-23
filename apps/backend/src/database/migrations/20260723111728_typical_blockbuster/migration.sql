ALTER TABLE "event_invites" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "event_invites" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
UPDATE "event_invites" SET "status" = 'VOLUNTEER_REJECTED' WHERE "status" = 'REJECTED';--> statement-breakpoint
DROP TYPE "event_invite_status";--> statement-breakpoint
CREATE TYPE "event_invite_status" AS ENUM('INVITED', 'ACCEPTED', 'VOLUNTEER_REJECTED', 'CANCELLED', 'SELF_JOINED');--> statement-breakpoint
ALTER TABLE "event_invites" ALTER COLUMN "status" SET DATA TYPE "event_invite_status" USING "status"::"event_invite_status";--> statement-breakpoint
ALTER TABLE "event_invites" ALTER COLUMN "status" SET DEFAULT 'INVITED'::"event_invite_status";--> statement-breakpoint
ALTER TABLE "shift_instance_invites" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "shift_instance_invites" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "shift_invites" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "shift_invites" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
UPDATE "shift_instance_invites" SET "status" = 'VOLUNTEER_REJECTED' WHERE "status" = 'REJECTED';--> statement-breakpoint
UPDATE "shift_invites" SET "status" = 'VOLUNTEER_REJECTED' WHERE "status" = 'REJECTED';--> statement-breakpoint
DROP TYPE "shift_invite_status";--> statement-breakpoint
CREATE TYPE "shift_invite_status" AS ENUM('INVITED', 'ACCEPTED', 'VOLUNTEER_REJECTED', 'CANCELLED', 'SELF_JOINED');--> statement-breakpoint
ALTER TABLE "shift_instance_invites" ALTER COLUMN "status" SET DATA TYPE "shift_invite_status" USING "status"::"shift_invite_status";--> statement-breakpoint
ALTER TABLE "shift_instance_invites" ALTER COLUMN "status" SET DEFAULT 'INVITED'::"shift_invite_status";--> statement-breakpoint
ALTER TABLE "shift_invites" ALTER COLUMN "status" SET DATA TYPE "shift_invite_status" USING "status"::"shift_invite_status";--> statement-breakpoint
ALTER TABLE "shift_invites" ALTER COLUMN "status" SET DEFAULT 'INVITED'::"shift_invite_status";