'use client';

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

interface PageHeaderContextValue {
  breadcrumb: ReactNode | null;
  setBreadcrumb: (node: ReactNode | null) => void;
}

const PageHeaderContext = createContext<PageHeaderContextValue | null>(null);

/** Wraps the admin shell's header + page content so a page deep in the tree can render into the fixed top header instead of its own body. */
export function PageHeaderProvider({ children }: { children: ReactNode }) {
  const [breadcrumb, setBreadcrumb] = useState<ReactNode | null>(null);
  const value = useMemo(() => ({ breadcrumb, setBreadcrumb }), [breadcrumb]);

  return (
    <PageHeaderContext.Provider value={value}>
      {children}
    </PageHeaderContext.Provider>
  );
}

/** Renders the current page's breadcrumb in the fixed header, falling back to the default "Clippy" title when no page has claimed the slot. */
export function PageHeaderSlot() {
  const ctx = useContext(PageHeaderContext);
  if (ctx?.breadcrumb) return ctx.breadcrumb;
  return <h1 className="text-lg font-semibold hidden sm:block">Clippy</h1>;
}

/**
 * A page calls this with its breadcrumb JSX to render it in the fixed header for as long as
 * the page is mounted. Pass a `useMemo`-stabilized node — an inline JSX literal gets a new
 * identity every render, which would re-run this effect (and re-render the header) on every
 * keystroke in the page below it.
 */
export function usePageBreadcrumb(node: ReactNode) {
  const ctx = useContext(PageHeaderContext);
  if (!ctx) {
    throw new Error('usePageBreadcrumb must be used within PageHeaderProvider');
  }
  const { setBreadcrumb } = ctx;

  useEffect(() => {
    setBreadcrumb(node);
    return () => setBreadcrumb(null);
  }, [node, setBreadcrumb]);
}
