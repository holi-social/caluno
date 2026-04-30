import type { Block, BlockRef, ResolvedBlock } from './types';

export function resolveBlockRefs(
  blockRefs: BlockRef[],
  blocks: Block[],
): ResolvedBlock[] {
  const blockMap = new Map(blocks.map((b) => [b.id, b]));

  return blockRefs
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((ref) => {
      const block = blockMap.get(ref.blockId);
      if (!block) return null;
      return {
        ...block,
        effectiveRequired: ref.required ?? block.required,
      };
    })
    .filter((b): b is ResolvedBlock => b !== null);
}
