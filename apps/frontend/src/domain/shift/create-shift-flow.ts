export type ShiftInstanceRef = {
  id: string;
  actualStartsAt: string | Date;
};

export function pickFirstShiftInstanceId(
  instances: ShiftInstanceRef[],
): string | undefined {
  const firstInstance = [...instances].sort(
    (a, b) =>
      new Date(a.actualStartsAt).getTime() -
      new Date(b.actualStartsAt).getTime(),
  )[0];

  return firstInstance?.id;
}

export type CreateShiftSuccessInput = {
  shiftId: string;
  instanceId?: string;
  openShift: boolean;
};

export type CreateShiftSuccessNavigation =
  | { action: 'open-invite'; shiftId: string; instanceId: string }
  | { action: 'success'; shiftId: string; instanceId?: string }
  | { action: 'close-create' };

export function resolveCreateShiftSuccessNavigation(
  result: CreateShiftSuccessInput,
): CreateShiftSuccessNavigation {
  if (result.openShift) {
    return {
      action: 'success',
      shiftId: result.shiftId,
      instanceId: result.instanceId,
    };
  }

  if (result.instanceId) {
    return {
      action: 'open-invite',
      shiftId: result.shiftId,
      instanceId: result.instanceId,
    };
  }

  return { action: 'close-create' };
}
