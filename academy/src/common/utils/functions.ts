import * as os from 'os';

export function formatErrorMessage(errorMessage: string): string {
  return errorMessage
    .replace(/"/g, '')
    .replace(/\s*{\s*/g, '{ ')
    .replace(/\s*}\s*/g, ' }')
    .replace(/\s*:\s*/g, ': ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
