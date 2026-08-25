import { describe, expect, it, mock } from 'bun:test';

const deleteMock = mock(async (_id: string) => ({ id: 'event-1' }));
const revalidatePathMock = mock((_path: string) => undefined);

mock.module('next/cache', () => ({
  revalidatePath: revalidatePathMock,
}));

mock.module('@/lib/data-client', () => ({
  getDataClient: async () => ({
    event: {
      delete: deleteMock,
    },
  }),
}));

const { deleteEvent } = await import('../actions');

describe('deleteEvent', () => {
  it('deletes the event via the data client', async () => {
    const result = await deleteEvent('org-1', 'event-1', {});
    expect(result.data).toEqual({ id: 'event-1' });
    expect(deleteMock).toHaveBeenCalledWith('event-1');
  });
});
