import { BadRequestException, HttpStatus, Inject, Injectable, PipeTransform, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';

import { ResponseUtil } from '../../../common/utils/response';
import { ClubService } from '../../club/club.service';
import { CoachService } from '../../coach/coach.service';
import { isGenderAllowed, isSameGender } from '../../../common/utils/functions';

@Injectable({ scope: Scope.REQUEST })
export class ValidateStudentDataPipe implements PipeTransform {
  constructor(
    private readonly clubService: ClubService,
    private readonly coachService: CoachService,

    @Inject(REQUEST) private readonly req: Request,
  ) {}

  async transform(value: any) {
    if (!value) return value;

    const { clubIds, national_code, gender } = value.createStudentDto;
    const userId = this.req?.data.user.id;

    try {
      if (national_code) await this.coachService.findCoachByNationalCode(national_code, { duplicateError: true });

      // const ownedClubs = await this.clubService.findOwnedClubs(userId clubIds);
      // this.coachService.validateCoachGender(gender, ownedClubs);

      // if (clubId) {
      //   const club = await this.clubService.checkClubOwnership(clubId, userId);
      //   const coach = await this.coachService.checkCoachOwnership(coachId, userId);

      //   if (!isSameGender(gender, coach.gender)) throw new BadRequestException(StudentMessages.CoachGenderMismatch);
      //   if (!isGenderAllowed(gender, club.genders)) throw new BadRequestException(StudentMessages.ClubGenderMismatch);

      //   return false;
      // }
    } catch (error) {
      return ResponseUtil.error(error?.message, HttpStatus.NOT_FOUND);
    }

    return value;
  }
}
