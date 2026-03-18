import { defineRelationsPart } from 'drizzle-orm';
import * as schema from '../../database/schema';

export const timeEntryRelations = defineRelationsPart(schema, () => ({
  timeEntries: {},
}));
