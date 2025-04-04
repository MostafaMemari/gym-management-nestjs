import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { BeltService } from './belt.service';
import { IBeltCreateDto, IBeltFilter, IBeltUpdateDto } from './interfaces/belt.interface';
import { BeltPatterns } from './patterns/belt.pattern';

import { IPagination } from '../../common/interfaces/pagination.interface';
import { ServiceResponse } from '../../common/interfaces/serviceResponse.interface';

@Controller()
export class BeltController {
  constructor(private readonly beltService: BeltService) {}

  @MessagePattern(BeltPatterns.CHECK_CONNECTION)
  checkConnection() {
    return true;
  }

  @MessagePattern(BeltPatterns.CREATE)
  create(@Payload() data: { createBeltDto: IBeltCreateDto }): Promise<ServiceResponse> {
    const { createBeltDto } = data;

    return this.beltService.create(createBeltDto);
  }
  @MessagePattern(BeltPatterns.UPDATE)
  update(@Payload() data: { beltId: number; updateBeltDto: IBeltUpdateDto }): Promise<ServiceResponse> {
    const { beltId, updateBeltDto } = data;

    return this.beltService.update(beltId, updateBeltDto);
  }
  @MessagePattern(BeltPatterns.GET_ALL)
  findAll(@Payload() data: { queryBeltDto: IBeltFilter; paginationDto: IPagination }): Promise<ServiceResponse> {
    const { queryBeltDto, paginationDto } = data;

    return this.beltService.getAll({ queryBeltDto, paginationDto });
  }
  @MessagePattern(BeltPatterns.GET_ONE)
  findOne(@Payload() data: { beltId: number }): Promise<ServiceResponse> {
    const { beltId } = data;

    return this.beltService.findOneById(beltId);
  }
  @MessagePattern(BeltPatterns.REMOVE)
  remove(@Payload() data: { beltId: number }): Promise<ServiceResponse> {
    const { beltId } = data;

    return this.beltService.removeById(beltId);
  }
  @MessagePattern(BeltPatterns.GET_BELT_BY_IDS)
  findByIds(@Payload() data: { beltIds: number[] }) {
    const { beltIds } = data;

    return this.beltService.findByIds(beltIds);
  }
}
