import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { CoachService } from './coach.service';
import { ICoachCreateDto, ICoachFilter, ICoachUpdateDto } from './interfaces/coach.interface';
import { CoachPatterns } from './patterns/coach.pattern';

import { IPagination } from '../../common/interfaces/pagination.interface';
import { IUser } from '../../common/interfaces/user.interface';

@Controller()
export class CoachController {
  constructor(private readonly coachService: CoachService) {}

  @MessagePattern(CoachPatterns.CheckConnection)
  checkConnection() {
    return true;
  }

  @MessagePattern(CoachPatterns.CreateCoach)
  create(@Payload() data: { user: IUser; createCoachDto: ICoachCreateDto }) {
    const { user, createCoachDto } = data;

    return this.coachService.create(user, createCoachDto);
  }
  @MessagePattern(CoachPatterns.UpdateCoach)
  update(@Payload() data: { user: IUser; coachId: number; updateCoachDto: ICoachUpdateDto }) {
    const { user, coachId, updateCoachDto } = data;

    return this.coachService.update(user, coachId, updateCoachDto);
  }

  @MessagePattern(CoachPatterns.GetCoaches)
  findAll(@Payload() data: { user: IUser; queryCoachDto: ICoachFilter; paginationDto: IPagination }) {
    const { user, queryCoachDto, paginationDto } = data;

    return this.coachService.getAll(user, { queryCoachDto, paginationDto });
  }

  @MessagePattern(CoachPatterns.GetCoach)
  findOne(@Payload() data: { user: IUser; coachId: number }) {
    const { user, coachId } = data;

    return this.coachService.findOneById(user, coachId);
  }

  @MessagePattern(CoachPatterns.RemoveUserCoach)
  remove(@Payload() data: { user: IUser; coachId: number }) {
    const { user, coachId } = data;

    return this.coachService.removeById(user, coachId);
  }
}
