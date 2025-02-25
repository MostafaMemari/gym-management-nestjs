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
export class ValidateStudentUpdatePipe implements PipeTransform {
  constructor(
    private readonly clubService: ClubService,
    private readonly coachService: CoachService,
    private readonly studentService: StudentService,
    @Inject(REQUEST) private readonly req: Request,
  ) {}

  async transform(value: any) {
    if (!value) return value;

    const { clubId, coachId, national_code, gender } = value.updateStudentDto;
    const userId = this.req?.data.user.id;
    const studentId = this.req?.data?.studentId;

    let coach = null;
    let club = null;
    let student = null;

    try {
      if (national_code) student = await this.validateNationalCode(national_code);

      if (!student) student = await this.studentService.validateOwnership(studentId, userId);

      if (clubId) club = await this.clubService.checkClubOwnership(clubId, userId);
      if (coachId) coach = await this.coachService.validateOwnership(coachId, userId);

      if (gender) {
        if (!club) club = await this.clubService.checkClubOwnership(student.clubId, userId);
        if (!coach) coach = await this.coachService.validateOwnership(student.coachId, userId);

        this.validateGender(gender, coach.gender, club.gender);
      }

      if (gender) this.validateGender(gender, coach.gender, club.genders);

      if (!this.req.data) this.req.data = {};
      this.req.data.student = student;

      return value;
    } catch (error) {
      return ResponseUtil.error(error?.message, HttpStatus.NOT_FOUND);
    }
  }

  private async validateNationalCode(national_code?: string, userId?: number) {
    if (national_code) await this.studentService.ensureUniqueNationalCode(national_code, userId);
  }
  private validateGender(studentGender: Gender, coachGender: Gender, allowedGenders: Gender[]) {
    if (coachGender && !isSameGender(studentGender, coachGender)) {
      throw new BadRequestException(StudentMessages.CoachGenderMismatch);
    }
    if (allowedGenders && !isGenderAllowed(studentGender, allowedGenders)) {
      throw new BadRequestException(StudentMessages.ClubGenderMismatch);
    }
  }
}
