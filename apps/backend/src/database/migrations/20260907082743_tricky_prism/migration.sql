ALTER TABLE "event_invites" ALTER COLUMN "status" SET DEFAULT 'ADMIN_INVITED'::"event_invite_status";--> statement-breakpoint
ALTER TABLE "shift_instance_invites" ALTER COLUMN "status" SET DEFAULT 'ADMIN_INVITED'::"shift_invite_status";--> statement-breakpoint
ALTER TABLE "shift_invites" ALTER COLUMN "status" SET DEFAULT 'ADMIN_INVITED'::"shift_invite_status";