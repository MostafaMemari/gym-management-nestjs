import * as os from 'os';
import { Gender } from '../enums/gender.enum';
import { BadRequestException } from '@nestjs/common';
import { ICreateClub } from '../../modules/club/interfaces/club.interface';
import { CoachMessages } from '../../modules/coach/enums/coach.message';

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

export function validateCoachGender(coachGender: Gender, clubs: ICreateClub[]): void {
  const invalidClubs = clubs.filter((club) => !isGenderAllowed(coachGender, club.genders)).map((club) => club.id);

  if (invalidClubs.length > 0) throw new BadRequestException(`${CoachMessages.CoachGenderMismatch} ${invalidClubs.join(', ')}`);
}
