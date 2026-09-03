const CHECK_IN_SUCCESS_DIALOG = 'check_in_success_dialog';

export type CheckInSuccessPayload = {
  volunteerName: string;
  volunteerImage: string | null;
  shiftTitle: string | null;
  timeRange: string | null;
  dateLabel: string | null;
};

export const getCheckInSuccessPayload = (): CheckInSuccessPayload | null => {
  if (typeof window === 'undefined') return null;
  const data = sessionStorage.getItem(CHECK_IN_SUCCESS_DIALOG);

  if (!data) return null;

  try {
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to parse check-in success dialog data', error);
    return null;
  }
};

export const setCheckInSuccessPayload = (payload: CheckInSuccessPayload) => {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(CHECK_IN_SUCCESS_DIALOG, JSON.stringify(payload));
};

export const clearCheckInSuccessPayload = () => {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(CHECK_IN_SUCCESS_DIALOG);
};
