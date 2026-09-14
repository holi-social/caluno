import { describe, expect, it } from 'bun:test';
import { isBoardInitialLoad } from './board-loading';

/** A query that has already delivered data for this mount. */
const settled = { isFetching: false, isFetchedAfterMount: true };
/** An enabled query fetching for the first time since mount. */
const firstFetch = { isFetching: true, isFetchedAfterMount: false };
/** A query held back by `enabled: false` — it never fetches, so it never blocks. */
const disabled = { isFetching: false, isFetchedAfterMount: false };
/** A settled query refetching in the background (e.g. after a mutation). */
const backgroundRefetch = { isFetching: true, isFetchedAfterMount: true };

describe('isBoardInitialLoad', () => {
  it('is true while an enabled query has not delivered data for this mount', () => {
    expect(isBoardInitialLoad([settled, firstFetch, settled])).toBe(true);
  });

  it('is true on a remount that refetches over stale cache', () => {
    // refetchOnMount: 'always' keeps the cached data visible while it refetches,
    // so isFetching alone is what separates "stale" from "fresh" here.
    expect(isBoardInitialLoad([firstFetch])).toBe(true);
  });

  it('is false once every enabled query has delivered data', () => {
    expect(isBoardInitialLoad([settled, settled])).toBe(false);
  });

  it('is false during a background refetch after a mutation', () => {
    // The regression this guards: a baseline save invalidates the board
    // queries, and treating that refetch as a load unmounted the board — and
    // with it any open creation modal, which reopened on step 1 (VOLI: the
    // "initial amount save reopens the volunteer picker" bug).
    expect(isBoardInitialLoad([settled, backgroundRefetch, settled])).toBe(
      false,
    );
  });

  it('does not block on a query that is disabled', () => {
    // needsTimesheet/paidShift stay disabled until the period and year are
    // known; they never fetch, so waiting on them would hang the skeleton.
    expect(isBoardInitialLoad([settled, disabled])).toBe(false);
  });

  it('is false with no queries at all', () => {
    expect(isBoardInitialLoad([])).toBe(false);
  });
});
