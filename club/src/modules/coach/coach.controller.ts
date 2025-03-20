import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { CoachService } from './coach.service';
import { ICoachCreateDto, ICoachFilter, ICoachUpdateDto } from './interfaces/coach.interface';
import { CoachPatterns } from './patterns/coach.pattern';

import { IPagination } from '../../common/interfaces/pagination.interface';
import { IUser } from '../../common/interfaces/user.interface';
import { ServiceResponse } from '../../common/interfaces/serviceResponse.interface';

@Controller()
export class CoachController {
  constructor(private readonly coachService: CoachService) {}

  @MessagePattern(CoachPatterns.CHECK_CONNECTION)
  checkConnection() {
    return true;
  }

  @MessagePattern(CoachPatterns.CREATE)
  create(@Payload() data: { user: IUser; createCoachDto: ICoachCreateDto }): Promise<ServiceResponse> {
    const { user, createCoachDto } = data;

    return this.coachService.create(user, createCoachDto);
  }
  @MessagePattern(CoachPatterns.UPDATE)
  update(@Payload() data: { user: IUser; coachId: number; updateCoachDto: ICoachUpdateDto }): Promise<ServiceResponse> {
    const { user, coachId, updateCoachDto } = data;

    return this.coachService.update(user, coachId, updateCoachDto);
  }
  @MessagePattern(CoachPatterns.GET_ALL)
  findAll(@Payload() data: { user: IUser; queryCoachDto: ICoachFilter; paginationDto: IPagination }): Promise<ServiceResponse> {
    const { user, queryCoachDto, paginationDto } = data;

    return this.coachService.getAll(user, { queryCoachDto, paginationDto });
  }
  @MessagePattern(CoachPatterns.GET_ONE)
  findOne(@Payload() data: { user: IUser; coachId: number }): Promise<ServiceResponse> {
    const { user, coachId } = data;

    return this.coachService.findOneById(user, coachId);
  }
  @MessagePattern(CoachPatterns.REMOVE)
  remove(@Payload() data: { user: IUser; coachId: number }): Promise<ServiceResponse> {
    const { user, coachId } = data;

    return this.coachService.removeById(user, coachId);
  }
}
