import { MyTimeEntry } from '../models/my-time-entry.model';

type MyTimeEntryInput = {
  id: string;
  startedAt: Date;
  endedAt: Date | null;
  shiftInstance: {
    overrideTitle: string | null;
    master: {
      title: string;
      organizationUnit: {
        name: string;
        organization: { name: string } | null;
      } | null;
    } | null;
  } | null;
};

export const toMyTimeEntry = (entry: MyTimeEntryInput): MyTimeEntry => {
  const master = entry.shiftInstance?.master ?? null;
  const orgUnit = master?.organizationUnit ?? null;

  const model = new MyTimeEntry();
  model.id = entry.id;
  model.startedAt = entry.startedAt;
  model.endedAt = entry.endedAt;
  model.shiftName = entry.shiftInstance?.overrideTitle ?? master?.title ?? '';
  model.organizationName = orgUnit?.organization?.name ?? '';
  model.organizationUnitName = orgUnit?.name ?? '';
  return model;
};
