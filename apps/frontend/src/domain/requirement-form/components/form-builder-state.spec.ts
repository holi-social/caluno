import { describe, expect, it } from 'bun:test';
import {
  appendBlockRef,
  type BuilderBlockRef,
  canSave,
  moveBlockRef,
  removeBlockRef,
} from './form-builder-state';

function makeRef(blockId: string, fieldOrder: number): BuilderBlockRef {
  return {
    id: `ref-${blockId}`,
    formId: 'form-1',
    blockId,
    fieldOrder,
    required: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

describe('canSave', () => {
  it('is false when the form has no blocks', () => {
    expect(canSave([], false)).toBe(false);
  });

  it('is false when the form has submissions', () => {
    expect(canSave([makeRef('b1', 0)], true)).toBe(false);
  });

  it('is true with blocks and no submissions', () => {
    expect(canSave([makeRef('b1', 0)], false)).toBe(true);
  });
});

describe('appendBlockRef', () => {
  it('appends a temp ref with the next fieldOrder', () => {
    const refs = [makeRef('b1', 0)];
    const next = appendBlockRef(refs, 'b2', 'form-1');
    expect(next).toHaveLength(2);
    const added = next[1];
    expect(added?.blockId).toBe('b2');
    expect(added?.id).toStartWith('temp-');
    expect(added?.fieldOrder).toBe(1);
    expect(added?.required).toBeNull();
  });

  it('does not duplicate a block already in the form', () => {
    const refs = [makeRef('b1', 0)];
    const next = appendBlockRef(refs, 'b1', 'form-1');
    expect(next).toHaveLength(1);
  });
});

describe('moveBlockRef', () => {
  it('swaps with the previous ref and reindexes fieldOrder', () => {
    const refs = [makeRef('b1', 0), makeRef('b2', 1), makeRef('b3', 2)];
    const next = moveBlockRef(refs, 1, 'up');
    expect(next.map((r) => r.blockId)).toEqual(['b2', 'b1', 'b3']);
    expect(next.map((r) => r.fieldOrder)).toEqual([0, 1, 2]);
  });

  it('swaps with the next ref', () => {
    const refs = [makeRef('b1', 0), makeRef('b2', 1)];
    const next = moveBlockRef(refs, 0, 'down');
    expect(next.map((r) => r.blockId)).toEqual(['b2', 'b1']);
  });

  it('is a no-op at the boundaries', () => {
    const refs = [makeRef('b1', 0), makeRef('b2', 1)];
    expect(moveBlockRef(refs, 0, 'up')).toBe(refs);
    expect(moveBlockRef(refs, 1, 'down')).toBe(refs);
    expect(moveBlockRef(refs, 5, 'down')).toBe(refs);
  });
});

describe('removeBlockRef', () => {
  it('removes the ref and reindexes fieldOrder', () => {
    const refs = [makeRef('b1', 0), makeRef('b2', 1), makeRef('b3', 2)];
    const next = removeBlockRef(refs, 1);
    expect(next.map((r) => r.blockId)).toEqual(['b1', 'b3']);
    expect(next.map((r) => r.fieldOrder)).toEqual([0, 1]);
  });
});
