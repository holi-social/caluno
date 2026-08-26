export type DiscoverTab = 'assignments' | 'events';

export function parseDiscoverTab(
  value: string | null | undefined,
): DiscoverTab {
  return value === 'events' ? 'events' : 'assignments';
}
