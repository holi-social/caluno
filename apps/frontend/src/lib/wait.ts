export const wait = (timeInMilliseconds = 1000) =>
  new Promise((resolve) => setTimeout(resolve, timeInMilliseconds));
