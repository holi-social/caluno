-- Backfill choice-field options saved with an empty value: the volunteer form
-- keys each option control by value, so an empty value can never stay selected.
-- Mirror the label into the value (same rule the editor now applies).
UPDATE "form_block_fields"
SET "options" = (
  SELECT jsonb_agg(
    jsonb_set(
      elem,
      '{value}',
      to_jsonb(COALESCE(NULLIF(btrim(elem->>'value'), ''), elem->>'label')),
      true
    )
  )
  FROM jsonb_array_elements("options") AS elem
)
WHERE "type" IN ('SINGLE_CHOICE', 'MULTI_CHOICE')
  AND "options" IS NOT NULL
  AND jsonb_typeof("options") = 'array'
  AND EXISTS (
    SELECT 1
    FROM jsonb_array_elements("options") AS e
    WHERE COALESCE(btrim(e->>'value'), '') = ''
  );
