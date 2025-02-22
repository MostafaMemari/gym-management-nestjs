import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { CoachService } from './coach.service';
import { ICoachQuery, ICreateCoach, IUpdateCoach } from './interfaces/coach.interface';
import { CoachPatterns } from './patterns/coach.pattern';
import { IUser } from '../club/interfaces/user.interface';

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
  update(@Payload() data: { coachId: number; updateCoachDto: IUpdateCoach }) {
    const { coachId, updateCoachDto } = data;
    return this.coachService.updateById(coachId, updateCoachDto);
  }

  @MessagePattern(CoachPatterns.GetCoaches)
  findAll(@Payload() query: ICoachQuery) {
    return this.coachService.getAll(query);
  }

  @MessagePattern(CoachPatterns.RemoveUserCoach)
  findOne(@Payload() data: { coachId: number }) {
    const { coachId } = data;
    return this.coachService.findOneById(coachId);
  }

  @MessagePattern(CoachPatterns.GetCoach)
  remove(@Payload() data: { coachId: number }) {
    const { coachId } = data;
    return this.coachService.removeById(coachId);
  }

  @MessagePattern(CoachPatterns.checkExistCoachById)
  checkExistById(@Payload() data: { coachId: number }) {
    return this.coachService.findCoachById(data.coachId, {});
  }
}
