type ExtractError<T extends Error = any> = (error: T, defaultMessage?: string) => string;

export const extractErrorMessage: ExtractError<Error> = (error, defaultMessage) => {
  if (typeof error == 'string') return error;
  else if (typeof error == 'object' && error?.message) return error.message;

  return defaultMessage || '';
};
