import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { CoachService } from './coach.service';
import { ICreateCoach, IQuery, IUpdateCoach } from './interfaces/coach.interface';
import { CoachPatterns } from './patterns/coach.pattern';
import { IUser } from '../club/interfaces/user.interface';
import { IPagination } from '../../common/interfaces/pagination.interface';

@Controller()
export class CoachController {
  constructor(private readonly coachService: CoachService) {}

  @MessagePattern(CoachPatterns.CheckConnection)
  checkConnection() {
    return true;
  }

  @MessagePattern(CoachPatterns.CreateCoach)
  create(@Payload() data: { user: IUser; createCoachDto: ICreateCoach }) {
    const { user, createCoachDto } = data;

    return this.coachService.create(user, createCoachDto);
  }
  @MessagePattern(CoachPatterns.UpdateCoach)
  update(@Payload() data: { user: IUser; coachId: number; updateCoachDto: IUpdateCoach }) {
    const { user, coachId, updateCoachDto } = data;

    return this.coachService.updateById(user, coachId, updateCoachDto);
  }

  @MessagePattern(CoachPatterns.GetCoaches)
  findAll(@Payload() data: { user: IUser; queryDto: IQuery; paginationDto: IPagination }) {
    const { user, queryDto, paginationDto } = data;

    return this.coachService.getAll(user, { queryDto, paginationDto });
  }

  @MessagePattern(CoachPatterns.RemoveUserCoach)
  findOne(@Payload() data: { user: IUser; coachId: number }) {
    const { user, coachId } = data;

    return this.coachService.findOneById(user, coachId);
  }

  @MessagePattern(CoachPatterns.GetCoach)
  remove(@Payload() data: { user: IUser; coachId: number }) {
    const { user, coachId } = data;

    return this.coachService.removeById(user, coachId);
  }

  @MessagePattern(CoachPatterns.checkExistCoachById)
  checkExistById(@Payload() data: { coachId: number }) {
    return this.coachService.findCoachById(data.coachId, {});
  }
}
