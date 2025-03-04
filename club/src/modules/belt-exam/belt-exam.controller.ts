import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { IPagination } from '../../common/interfaces/pagination.interface';
import { BeltExamService } from './belt-exam.service';
import { BeltExamPatterns } from './patterns/belt-exam.pattern';
import { ICreateBeltExam, ISearchBeltExamQuery, IUpdateBeltExam } from './interfaces/belt-exam.interface';

@Controller()
export class BeltExamController {
  constructor(private readonly beltExamService: BeltExamService) {}

  @MessagePattern(BeltExamPatterns.CheckConnection)
  checkConnection() {
    return true;
  }

  @MessagePattern(BeltExamPatterns.CreateBeltExam)
  create(@Payload() data: { createBeltExamDto: ICreateBeltExam }) {
    const { createBeltExamDto } = data;

    return this.beltExamService.create(createBeltExamDto);
  }
  @MessagePattern(BeltExamPatterns.UpdateBeltExam)
  update(@Payload() data: { beltExamId: number; updateBeltExamDto: IUpdateBeltExam }) {
    const { beltExamId, updateBeltExamDto } = data;

    return this.beltExamService.update(beltExamId, updateBeltExamDto);
  }

  @MessagePattern(BeltExamPatterns.GetBeltExams)
  findAll(@Payload() data: { queryBeltExamDto: ISearchBeltExamQuery; paginationDto: IPagination }) {
    const { queryBeltExamDto, paginationDto } = data;

    return this.beltExamService.getAll({ queryBeltExamDto, paginationDto });
  }

  @MessagePattern(BeltExamPatterns.GetBeltExam)
  findOne(@Payload() data: { beltExamId: number }) {
    const { beltExamId } = data;

    return this.beltExamService.findOneById(beltExamId);
  }

  @MessagePattern(BeltExamPatterns.RemoveBeltExam)
  remove(@Payload() data: { beltExamId: number }) {
    const { beltExamId } = data;

    return this.beltExamService.removeById(beltExamId);
  }
}
