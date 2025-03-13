import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { IPagination } from '../../common/interfaces/pagination.interface';
import { BeltExamService } from './belt-exam.service';
import { BeltExamPatterns } from './patterns/belt-exam.pattern';
import { IBeltExamCreateDto, IBeltExamFilter, IBeltExamUpdateDto } from './interfaces/belt-exam.interface';

@Controller()
export class BeltExamController {
  constructor(private readonly beltExamService: BeltExamService) {}

  @MessagePattern(BeltExamPatterns.CHECK_CONNECTION)
  checkConnection() {
    return true;
  }

  @MessagePattern(BeltExamPatterns.CREATE)
  create(@Payload() data: { createBeltExamDto: IBeltExamCreateDto }) {
    const { createBeltExamDto } = data;

    return this.beltExamService.create(createBeltExamDto);
  }
  @MessagePattern(BeltExamPatterns.UPDATE)
  update(@Payload() data: { beltExamId: number; updateBeltExamDto: IBeltExamUpdateDto }) {
    const { beltExamId, updateBeltExamDto } = data;

    return this.beltExamService.update(beltExamId, updateBeltExamDto);
  }

  @MessagePattern(BeltExamPatterns.GET_ALL)
  findAll(@Payload() data: { queryBeltExamDto: IBeltExamFilter; paginationDto: IPagination }) {
    const { queryBeltExamDto, paginationDto } = data;

    return this.beltExamService.getAll({ queryBeltExamDto, paginationDto });
  }

  @MessagePattern(BeltExamPatterns.GET_ONE)
  findOne(@Payload() data: { beltExamId: number }) {
    const { beltExamId } = data;

    return this.beltExamService.findOneById(beltExamId);
  }

  @MessagePattern(BeltExamPatterns.REMOVE)
  remove(@Payload() data: { beltExamId: number }) {
    const { beltExamId } = data;

    return this.beltExamService.removeById(beltExamId);
  }
}
