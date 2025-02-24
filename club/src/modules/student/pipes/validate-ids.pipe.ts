import { HttpStatus, Inject, Injectable, PipeTransform, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';

import { ResponseUtil } from '../../../common/utils/response';
import { ClubService } from '../../../modules/club/club.service';
import { CoachService } from '../../../modules/coach/coach.service';
import { StudentService } from '../student.service';

@Injectable({ scope: Scope.REQUEST })
export class ValidateIdsPipe implements PipeTransform {
  constructor(
    private readonly clubService: ClubService,
    private readonly coachService: CoachService,
    private readonly studentService: StudentService,

    @Inject(REQUEST) private readonly req: Request,
  ) {}

  async transform(value: any) {
    if (!value) return value;

    const { clubId, coachId, national_code } = value.createStudentDto;
    const userId = this.req?.data.user.id;

    try {
      if (national_code) await this.studentService.findStudentByNationalCode(national_code, { duplicateError: true });

      if (clubId && coachId) {
        const club = await this.clubService.checkClubOwnership(clubId, userId);
        const coach = await this.coachService.checkCoachOwnership(coachId, userId);

        console.log(club);
        console.log(coach);
      }
    } catch (error) {
      return ResponseUtil.error(error?.message, HttpStatus.NOT_FOUND);
    }

    return value;
  }
}
