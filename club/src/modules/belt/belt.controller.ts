import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { IBeltCreateDto, IBeltUpdateDto, IBeltFilter } from './interfaces/belt.interface';
import { BeltService } from './belt.service';
import { BeltPatterns } from './patterns/belt.pattern';

import { IPagination } from '../../common/interfaces/pagination.interface';

@Controller()
export class BeltController {
  constructor(private readonly beltService: BeltService) {}

  @MessagePattern(BeltPatterns.CHECK_CONNECTION)
  checkConnection() {
    return true;
  }

  @MessagePattern(BeltPatterns.CREATE)
  create(@Payload() data: { createBeltDto: IBeltCreateDto }) {
    const { createBeltDto } = data;

    return this.beltService.create(createBeltDto);
  }
  @MessagePattern(BeltPatterns.UPDATE)
  update(@Payload() data: { beltId: number; updateBeltDto: IBeltUpdateDto }) {
    const { beltId, updateBeltDto } = data;

    return this.beltService.update(beltId, updateBeltDto);
  }
  @MessagePattern(BeltPatterns.GET_ALL)
  findAll(@Payload() data: { queryBeltDto: IBeltFilter; paginationDto: IPagination }) {
    const { queryBeltDto, paginationDto } = data;

    return this.beltService.getAll({ queryBeltDto, paginationDto });
  }
  @MessagePattern(BeltPatterns.GET_ONE)
  findOne(@Payload() data: { beltId: number }) {
    const { beltId } = data;

    return this.beltService.findOneById(beltId);
  }
  @MessagePattern(BeltPatterns.REMOVE)
  remove(@Payload() data: { beltId: number }) {
    const { beltId } = data;

    return this.beltService.removeById(beltId);
  }
}
