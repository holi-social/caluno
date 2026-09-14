-- Templates seeded by fixtures.ts were inserted directly, bypassing
-- createDocumentTemplate, and carry a skeleton body that renders near-empty
-- documents while the UI shows the slot as configured. createDocumentTemplate
-- and updateDocumentTemplate always stamp last_edited_at, so a NULL there
-- identifies a seeded stub and can never match a human-authored template.
-- Soft delete, so the partial unique indexes (WHERE is_deleted = false) free
-- the slot for a real template.
UPDATE "document_templates"
SET "is_deleted" = true
WHERE "last_edited_at" IS NULL
  AND "is_deleted" = false;
