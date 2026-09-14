/**
 * The two TanStack Query flags that decide whether a board query is still
 * working towards its first result for the current mount.
 */
export interface BoardQueryProgress {
  isFetching: boolean;
  isFetchedAfterMount: boolean;
}

/**
 * Whether the reimbursements board is still loading its first set of data for
 * this mount — the only state in which it may render a skeleton instead of the
 * board.
 *
 * The board's queries use `refetchOnMount: 'always'`, so a remount refetches
 * over cached data and must not show that stale cache: while a query is
 * fetching and has not yet delivered a post-mount result, we wait.
 *
 * Crucially this is *not* the same as `isFetching`. Once a query has delivered
 * data for this mount, later background refetches — the ones a mutation's
 * `invalidateQueries` triggers — leave the board mounted. Swapping the board
 * for a skeleton on those unmounted every open dialog with it, so a creation
 * modal reopened at step one with its selection lost.
 *
 * A disabled query (`enabled: false`) never fetches, so it never blocks.
 */
export function isBoardInitialLoad(queries: BoardQueryProgress[]): boolean {
  return queries.some(
    (query) => query.isFetching && !query.isFetchedAfterMount,
  );
}
