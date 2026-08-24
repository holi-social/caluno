// Frontend-only narrowing of the backend's opaque `DocumentTemplate.body`
// JSON scalar (see `apps/backend/src/accounting/schemas/document-template.schema.ts`'s
// `DocumentTemplateBody = { header: unknown, blocks: unknown[], footer: unknown }`).
// The backend stores and returns this as untyped JSONB; this file gives the
// document-template builder a real shape to work with on the client side,
// plus conversion helpers to/from the `Record<string, unknown>` shape that
// codegen produces for the `JSON` scalar.

export type TemplateTextBlock = {
  kind: 'text';
  id: string;
  content: string;
};

export type TemplateTableColumn = {
  id: string;
  label: string;
};

export type TemplateTableBlock = {
  kind: 'table';
  id: string;
  columns: TemplateTableColumn[];
};

export type TemplateBlock = TemplateTextBlock | TemplateTableBlock;

export type TemplateBody = {
  header: { title?: string; logoUrl?: string };
  blocks: TemplateBlock[];
  footer: { note?: string };
};

export function serializeTemplateBody(body: TemplateBody): Record<string, unknown> {
  return body as unknown as Record<string, unknown>;
}

export function parseTemplateBody(raw: Record<string, unknown>): TemplateBody {
  const header = (raw.header ?? {}) as TemplateBody['header'];
  const blocks = (Array.isArray(raw.blocks) ? raw.blocks : []) as TemplateBlock[];
  const footer = (raw.footer ?? {}) as TemplateBody['footer'];
  return { header, blocks, footer };
}
