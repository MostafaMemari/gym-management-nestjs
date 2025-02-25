import { BadRequestException, HttpStatus, Inject, Injectable, PipeTransform, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';

import { StudentMessages } from '../enums/student.message';
import { StudentService } from '../student.service';

import { ClubService } from '../../club/club.service';
import { CoachService } from '../../coach/coach.service';

import { Gender } from '../../../common/enums/gender.enum';
import { isGenderAllowed, isSameGender } from '../../../common/utils/functions';
import { ResponseUtil } from '../../../common/utils/response';

@Injectable({ scope: Scope.REQUEST })
export class ValidateStudentCreatePipe implements PipeTransform {
  constructor(
    private readonly clubService: ClubService,
    private readonly coachService: CoachService,
    private readonly studentService: StudentService,
    @Inject(REQUEST) private readonly req: Request,
  ) {}

  async transform(value: any) {
    if (!value) return value;

    const { clubId, coachId, national_code, gender } = value.createStudentDto;
    const userId = this.req?.data.user.id;

    try {
      if (national_code) await this.validateNationalCode(national_code, userId);
      if (clubId && coachId) {
        const club = await this.clubService.checkClubOwnership(clubId, userId);
        const coach = await this.coachService.validateOwnership(coachId, userId);

        if (gender) this.validateGender(gender, coach.gender, club.genders);
      }

      return value;
    } catch (error) {
      return ResponseUtil.error(error?.message, HttpStatus.NOT_FOUND);
    }
  }

  private async validateNationalCode(national_code?: string, userId?: number) {
    if (national_code) await this.studentService.ensureUniqueNationalCode(national_code, userId);
  }

  private validateGender(studentGender: Gender, coachGender: Gender, allowedGenders: Gender[]) {
    if (!isSameGender(studentGender, coachGender)) {
      throw new BadRequestException(StudentMessages.CoachGenderMismatch);
    }
    if (!isGenderAllowed(studentGender, allowedGenders)) {
      throw new BadRequestException(StudentMessages.ClubGenderMismatch);
    }
  }
}
