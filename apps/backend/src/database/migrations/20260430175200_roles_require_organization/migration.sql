DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "roles"
    WHERE "organization_id" IS NULL
  ) THEN
    RAISE EXCEPTION 'Cannot enforce NOT NULL on roles.organization_id while roles without organization exist';
  END IF;
END
$$;
--> statement-breakpoint
ALTER TABLE "roles" ALTER COLUMN "organization_id" SET NOT NULL;
