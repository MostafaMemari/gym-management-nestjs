import * as os from 'os';
import { Gender } from '../enums/gender.enum';

export function formatErrorMessage(errorMessage: string): string {
  return errorMessage
    .replace(/"/g, '')
    .replace(/\s*{\s*/g, '{ ')
    .replace(/\s*}\s*/g, ' }')
    .replace(/\s*:\s*/g, ': ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function getServerIp() {
  const interfaces = os.networkInterfaces();
  for (const interfaceName in interfaces) {
    const addresses = interfaces[interfaceName];
    if (addresses) {
      for (const addr of addresses) {
        if (addr.family === 'IPv4' && !addr.internal) {
          return addr.address;
        }
      }
    }
  }
  return 'localhost';
}

export function getPreviousMonthDate(monthsAgo: number) {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth() - monthsAgo, today.getDate());
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isSameGender(targetGender: Gender, referenceGender: Gender): boolean {
  return targetGender === referenceGender;
}

export function isGenderAllowed(targetGender: Gender, allowedGenders: Gender[]): boolean {
  return allowedGenders.includes(targetGender);
}

export function replaceYaWithYe(input: string): string {
  return input.replace(/ي/g, 'ی');
}
function normalizeNationalCode(nationalCode: string): string {
  return nationalCode ? nationalCode.padStart(10, '0') : '';
}
