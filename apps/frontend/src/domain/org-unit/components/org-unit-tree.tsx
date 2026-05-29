'use client';

import type { OrgUnitNodeFieldsFragment } from '@repo/data';
import {
  TreeExpander,
  TreeIcon,
  TreeLabel,
  TreeNode,
  TreeNodeContent,
  TreeNodeTrigger,
  TreeProvider,
  TreeView,
} from '@repo/ui';
import {
  EyeIcon,
  HouseIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getDynamicIcon } from '@/lib/dynamic-icon';

type OrgUnitNode = OrgUnitNodeFieldsFragment & {
  children?: OrgUnitNode[];
};

interface OrgUnitTreeProps {
  root: OrgUnitNode;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onCreate: (node: OrgUnitNode) => void;
  onEdit: (node: OrgUnitNode) => void;
  onDelete: (node: OrgUnitNode) => void;
}

interface OrgUnitNodeItemProps {
  node: OrgUnitNode;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onCreate: (node: OrgUnitNode) => void;
  onEdit: (node: OrgUnitNode) => void;
  onDelete: (node: OrgUnitNode) => void;
  level?: number;
  isLast?: boolean;
  parentPath?: boolean[];
}

function collectAllIds(node: OrgUnitNode): string[] {
  const ids: string[] = [node.id];
  if (node.children) {
    for (const child of node.children) {
      ids.push(...collectAllIds(child));
    }
  }
  return ids;
}

function OrgUnitNodeItem({
  node,
  canCreate,
  canEdit,
  canDelete,
  onCreate,
  onEdit,
  onDelete,
  level = 0,
  isLast = false,
  parentPath = [],
}: OrgUnitNodeItemProps) {
  const router = useRouter();

  const Icon = getDynamicIcon(node.type.icon, HouseIcon);
  const children = node.children ?? [];
  const hasChildren = children.length > 0;

  // Replicate TreeNode's parentPath computation so children receive the correct path
  const currentPath = level === 0 ? [] : [...parentPath];
  if (level > 0) {
    currentPath[level - 1] = isLast;
  }

  return (
    <TreeNode
      nodeId={node.id}
      level={level}
      isLast={isLast}
      parentPath={parentPath}
    >
      <TreeNodeTrigger>
        <TreeExpander hasChildren={hasChildren} />

        <TreeIcon
          icon={<Icon className="h-6 w-6" />}
          hasChildren={hasChildren}
        />

        <span className="flex flex-row gap-6">
          <TreeLabel>{node.name}</TreeLabel>

          <span className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              className="rounded p-1 hover:bg-accent"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/${node.id}`);
              }}
              title="Visit org unit"
            >
              <EyeIcon className="h-5 w-5" />
            </button>

            {canCreate && (
              <button
                type="button"
                className="rounded p-1 hover:bg-accent"
                onClick={(e) => {
                  e.stopPropagation();
                  onCreate(node);
                }}
                title="Add child"
              >
                <PlusIcon className="h-5 w-5" />
              </button>
            )}

            {canEdit && (
              <button
                type="button"
                className="rounded p-1 hover:bg-accent"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(node);
                }}
                title="Edit"
              >
                <PencilIcon className="h-5 w-5" />
              </button>
            )}

            {!!node.parent?.id && canDelete && (
              <button
                type="button"
                className="rounded p-1 hover:bg-destructive/20 text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(node);
                }}
                title="Delete"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            )}
          </span>
        </span>
      </TreeNodeTrigger>

      {hasChildren && (
        <TreeNodeContent hasChildren>
          {children.map((child, index) => (
            <OrgUnitNodeItem
              key={child.id}
              node={child}
              canCreate={canCreate}
              canEdit={canEdit}
              canDelete={canDelete}
              onCreate={onCreate}
              onEdit={onEdit}
              onDelete={onDelete}
              level={level + 1}
              isLast={index === children.length - 1}
              parentPath={currentPath}
            />
          ))}
        </TreeNodeContent>
      )}
    </TreeNode>
  );
}

export function OrgUnitTree({
  root,
  onCreate,
  onEdit,
  onDelete,
  canCreate,
  canEdit,
  canDelete,
}: OrgUnitTreeProps) {
  const allIds = collectAllIds(root);

  return (
    <TreeProvider defaultExpandedIds={allIds} animateExpand>
      <TreeView className="w-full">
        <OrgUnitNodeItem
          node={root}
          canCreate={canCreate}
          canEdit={canEdit}
          canDelete={canDelete}
          onCreate={onCreate}
          onEdit={onEdit}
          onDelete={onDelete}
          isLast
        />
      </TreeView>
    </TreeProvider>
  );
}
