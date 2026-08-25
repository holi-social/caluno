ALTER TABLE "organization_unit_types" ADD COLUMN "organization_id" uuid;--> statement-breakpoint
UPDATE "organization_unit_types" AS "out"
SET "organization_id" = "sub"."organization_id"
FROM (
  SELECT DISTINCT ON ("type_id") "type_id", "organization_id"
  FROM "organization_units"
  ORDER BY "type_id", "organization_id"
) AS "sub"
WHERE "out"."id" = "sub"."type_id";--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "organization_unit_types"
    WHERE "organization_id" IS NULL
  ) THEN
    RAISE EXCEPTION 'Cannot backfill organization_unit_types.organization_id for all rows';
  END IF;

  IF EXISTS (
    SELECT "type_id"
    FROM "organization_units"
    GROUP BY "type_id"
    HAVING COUNT(DISTINCT "organization_id") > 1
  ) THEN
    RAISE EXCEPTION 'organization_unit_types are shared across organizations';
  END IF;
END
$$;--> statement-breakpoint
ALTER TABLE "organization_unit_types" ALTER COLUMN "organization_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "organization_unit_types" ADD CONSTRAINT "uq_organization_unit_types_organization_id_name" UNIQUE("organization_id","name");--> statement-breakpoint
CREATE INDEX "idx_organization_unit_types_organization_id" ON "organization_unit_types" ("organization_id");--> statement-breakpoint
ALTER TABLE "organization_unit_types" ADD CONSTRAINT "organization_unit_types_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;
