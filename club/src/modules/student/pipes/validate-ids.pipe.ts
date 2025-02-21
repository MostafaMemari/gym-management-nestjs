import { PipeTransform, Injectable, Scope, Inject, HttpStatus } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';

import { ClubService } from '../../../modules/club/club.service';
import { CoachService } from '../../../modules/coach/coach.service';
import { ResponseUtil } from '../../../common/utils/response';
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

    try {
      if (national_code) await this.studentService.findStudentByNationalCode(national_code, { duplicateError: true });
      if (clubId) await this.clubService.findClubById(clubId, { notFoundError: true });
      if (coachId) await this.coachService.findCoachById(coachId, { notFoundError: true });
    } catch (error) {
      return ResponseUtil.error(error?.message, HttpStatus.NOT_FOUND);
    }

    return value;
  }
}
