import { HttpStatus, Inject, Injectable, PipeTransform, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';

import { ResponseUtil } from '../../../common/utils/response';
import { ClubService } from '../../club/club.service';
import { CoachService } from '../../coach/coach.service';

import { Gender } from '../../../common/enums/gender.enum';

@Injectable({ scope: Scope.REQUEST })
export class ValidateCoachPipe implements PipeTransform {
  constructor(
    private readonly clubService: ClubService,
    private readonly coachService: CoachService,
    @Inject(REQUEST) private readonly req: Request,
  ) {}

  async transform(value: any) {
    if (!value) return value;

    const { clubIds, national_code, gender } = value.createCoachDto;
    const userId = this.req?.data.user.id;

    try {
      if (national_code) await this.validateNationalCode(national_code);

      if (clubIds && gender) {
        const ownedClubs = await this.getOwnedClubs(userId, clubIds);
        this.validateGender(gender, ownedClubs);
        value.createCoachDto.clubs = ownedClubs;
      }

      return value;
    } catch (error) {
      return ResponseUtil.error(error?.message, HttpStatus.NOT_FOUND);
    }
  }

  private async validateNationalCode(national_code?: string) {
    if (national_code) {
      await this.coachService.findCoachByNationalCode(national_code, { duplicateError: true });
    }
  }
  private async getOwnedClubs(userId: number, clubIds: number[]) {
    return this.clubService.findOwnedClubs(userId, clubIds);
  }
  private validateGender(gender: Gender, ownedClubs: any[]) {
    this.coachService.validateCoachGender(gender, ownedClubs);
  }
}
