import { useCallback, useRef, useState } from 'react';

const MAX_HISTORY = 50;

export function useUndoRedo<T>(initial: T) {
  const [state, setState] = useState(initial);
  const past = useRef<T[]>([]);
  const future = useRef<T[]>([]);

  const set = useCallback((next: T | ((prev: T) => T)) => {
    setState((prev) => {
      const resolved = typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
      past.current = [...past.current.slice(-(MAX_HISTORY - 1)), prev];
      future.current = [];
      return resolved;
    });
  }, []);

  const undo = useCallback(() => {
    setState((prev) => {
      if (past.current.length === 0) return prev;
      const previous = past.current[past.current.length - 1]!;
      past.current = past.current.slice(0, -1);
      future.current = [prev, ...future.current];
      return previous;
    });
  }, []);

  const redo = useCallback(() => {
    setState((prev) => {
      if (future.current.length === 0) return prev;
      const next = future.current[0]!;
      future.current = future.current.slice(1);
      past.current = [...past.current, prev];
      return next;
    });
  }, []);

  const canUndo = past.current.length > 0;
  const canRedo = future.current.length > 0;

  return { state, set, undo, redo, canUndo, canRedo } as const;
}
