ALTER TABLE "requirement_fulfillments" ADD COLUMN "type" "requirement_type";
--> statement-breakpoint
UPDATE "requirement_fulfillments" AS "rf"
SET "type" = "r"."type"
FROM "requirements" AS "r"
WHERE "rf"."requirement_id" = "r"."id";
--> statement-breakpoint
ALTER TABLE "requirement_fulfillments" ALTER COLUMN "type" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "requirement_fulfillments"
ALTER COLUMN "value" TYPE jsonb
USING CASE
  WHEN "value" IS NULL THEN NULL
  WHEN "type" = 'DOCUMENT' THEN jsonb_build_object(
    'documentId',
    COALESCE("document_id"::text, "value"::text)
  )
  WHEN "type" = 'CHECK' THEN jsonb_build_object(
    'checked',
    CASE
      WHEN "value"::text = 'true' THEN true
      WHEN "value"::text = 'false' THEN false
      ELSE NULL
    END
  )
  WHEN "type" = 'DATE' THEN jsonb_build_object('date', "value"::text)
  ELSE jsonb_build_object('text', "value"::text)
END;
--> statement-breakpoint
ALTER TABLE "requirement_fulfillments" DROP COLUMN "document_id";
