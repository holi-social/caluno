// Drizzle wraps postgres errors, so the driver error lives on `error.cause`.
// '23505' is the Postgres unique-violation SQLSTATE.
export const isUniqueConstraintViolation = (
  error: unknown,
  constraintName: string,
): boolean => {
  const driverError =
    error instanceof Error && 'cause' in error && error.cause
      ? error.cause
      : error;

  return (
    !!driverError &&
    typeof driverError === 'object' &&
    'code' in driverError &&
    driverError.code === '23505' &&
    'constraint' in driverError &&
    driverError.constraint === constraintName
  );
};
