'use client';

import type { FormBlock, RequirementForm } from '@repo/data';
import {
  Badge,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui';
import { Eye, Loader2, Pencil, Trash2 } from 'lucide-react';
import { useTransition } from 'react';
import { DeleteAlertDialog } from '@/components/delete-alert-dialog';
import { FormattedDate } from '@/components/formatted-date';
import { useSheetTrigger } from '@/hooks/use-sheet';

function BlockActions({
  block,
  onDelete,
}: {
  block: FormBlock;
  onDelete: (id: string) => Promise<void>;
}) {
  const [isDeleting, startDeleteTransition] = useTransition();
  const { open: openSheet } = useSheetTrigger('block-form');

  function handleDelete() {
    startDeleteTransition(() => onDelete(block.id));
  }

  return (
    <aside className="flex items-center gap-1">
      <Button
        size="icon-xs"
        variant="outline"
        aria-label={block.isEditable ? 'Edit block' : 'View block'}
        onClick={() => openSheet({ id: block.id })}
      >
        {block.isEditable ? <Pencil /> : <Eye />}
      </Button>
      <DeleteAlertDialog
        title="Delete block?"
        description={`"${block.title}" will be permanently removed.`}
        onDelete={handleDelete}
        trigger={
          <Button
            size="icon-xs"
            variant="destructive"
            aria-label="Delete block"
            disabled={isDeleting}
          >
            {isDeleting ? <Loader2 className="animate-spin" /> : <Trash2 />}
          </Button>
        }
      />
    </aside>
  );
}

export function BlocksTable({
  blocks,
  forms,
  onDelete,
}: {
  blocks: FormBlock[];
  forms: RequirementForm[];
  onDelete: (id: string) => Promise<void>;
}) {
  const { open: openSheet } = useSheetTrigger('block-form');

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Fields</TableHead>
            <TableHead>Used in</TableHead>
            <TableHead>Editable</TableHead>
            <TableHead>Updated</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {blocks.map((block) => {
            const fieldCount = block.fields?.length ?? 0;
            const usedInForms = forms.filter((f) =>
              (f.blockRefs ?? []).some((ref) => ref.blockId === block.id),
            );

            return (
              <TableRow key={block.id}>
                <TableCell>
                  <button
                    type="button"
                    className="hover:underline font-medium text-left"
                    onClick={() => openSheet({ id: block.id })}
                  >
                    {block.title}
                  </button>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {fieldCount} {fieldCount === 1 ? 'field' : 'fields'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {usedInForms.length === 0 ? (
                    <span className="text-muted-foreground text-sm">—</span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {usedInForms.map((f) => (
                        <Badge
                          key={f.id}
                          variant="secondary"
                          className="text-xs"
                        >
                          {f.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {block.isEditable ? (
                    <Badge
                      variant="outline"
                      className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs"
                    >
                      Yes
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-sm">No</span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground whitespace-nowrap">
                  <FormattedDate date={block.updatedAt} />
                </TableCell>
                <TableCell>
                  <BlockActions block={block} onDelete={onDelete} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
