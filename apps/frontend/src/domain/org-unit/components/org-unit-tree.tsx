'use client';

import type { OrgUnitTreeNode } from '@repo/data';
import {
  Button,
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
  Share2Icon,
  TrashIcon,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getDynamicIcon } from '@/lib/dynamic-icon';
import { copyToClipboard } from '../../../lib/clipboard';
import { organizationUnitUrl } from '../../organization/share';

interface OrgUnitTreeProps {
  root: OrgUnitTreeNode;
  canEdit: boolean;
  onCreate: (node: OrgUnitTreeNode) => void;
  onEdit: (node: OrgUnitTreeNode) => void;
  onDelete: (node: OrgUnitTreeNode) => void;
}

interface OrgUnitNodeItemProps {
  node: OrgUnitTreeNode;
  canEdit: boolean;
  onCreate: (node: OrgUnitTreeNode) => void;
  onEdit: (node: OrgUnitTreeNode) => void;
  onDelete: (node: OrgUnitTreeNode) => void;
  level?: number;
  isLast?: boolean;
  parentPath?: boolean[];
}

function collectAllIds(node: OrgUnitTreeNode): string[] {
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
  canEdit,
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
            <Button
              size="icon-xs"
              variant="outline"
              aria-label="Visit org unit"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/${node.id}`);
              }}
            >
              <EyeIcon />
            </Button>

            <Button
              size="icon-xs"
              variant="outline"
              aria-label="Copy org unit link to clipboard"
              onClick={(e) => {
                e.stopPropagation();
                copyToClipboard(
                  organizationUnitUrl(node.id),
                  'Org unit link copied to clipboard',
                );
              }}
            >
              <Share2Icon />
            </Button>

            {canEdit && (
              <>
                <Button
                  size="icon-xs"
                  variant="outline"
                  aria-label="Add child"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCreate(node);
                  }}
                >
                  <PlusIcon />
                </Button>

                <Button
                  size="icon-xs"
                  variant="outline"
                  aria-label="Edit"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(node);
                  }}
                >
                  <PencilIcon />
                </Button>

                {!!node.parentId && (
                  <Button
                    size="icon-xs"
                    variant="destructive"
                    aria-label="Delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(node);
                    }}
                  >
                    <TrashIcon />
                  </Button>
                )}
              </>
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
              canEdit={canEdit}
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
  canEdit,
}: OrgUnitTreeProps) {
  const allIds = collectAllIds(root);

  return (
    <TreeProvider defaultExpandedIds={allIds} animateExpand>
      <TreeView className="w-full">
        <OrgUnitNodeItem
          node={root}
          canEdit={canEdit}
          onCreate={onCreate}
          onEdit={onEdit}
          onDelete={onDelete}
          isLast
        />
      </TreeView>
    </TreeProvider>
  );
}
