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
export class ValidateStudentPipe implements PipeTransform {
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
      await this.validateNationalCode(national_code);
      if (clubId && coachId) await this.validateClubAndCoach(clubId, coachId, gender, userId);

      return value;
    } catch (error) {
      return ResponseUtil.error(error?.message, HttpStatus.NOT_FOUND);
    }
  }

  private async validateNationalCode(national_code?: string) {
    if (national_code) await this.studentService.findStudentByNationalCode(national_code, { duplicateError: true });
  }

  private async validateClubAndCoach(clubId: number, coachId: number, gender: Gender, userId: number) {
    const club = await this.clubService.checkClubOwnership(clubId, userId);
    const coach = await this.coachService.checkCoachOwnership(coachId, userId);

    this.validateGender(gender, coach.gender, club.genders);
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
