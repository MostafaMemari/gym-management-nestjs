import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { ICreateBelt, IUpdateBelt, ISearchBeltQuery } from './interfaces/belt.interface';
import { BeltService } from './belt.service';
import { BeltPatterns } from './patterns/belt.pattern';

import { IPagination } from '../../common/interfaces/pagination.interface';

@Controller()
export class BeltController {
  constructor(private readonly beltService: BeltService) {}

  @MessagePattern(BeltPatterns.CheckConnection)
  checkConnection() {
    return true;
  }

  @MessagePattern(BeltPatterns.CreateBelt)
  create(@Payload() data: { createBeltDto: ICreateBelt }) {
    const { createBeltDto } = data;

    return this.beltService.create(createBeltDto);
  }
  @MessagePattern(BeltPatterns.UpdateBelt)
  update(@Payload() data: { beltId: number; updateBeltDto: IUpdateBelt }) {
    const { beltId, updateBeltDto } = data;

    return this.beltService.update(beltId, updateBeltDto);
  }

  @MessagePattern(BeltPatterns.GetBelts)
  findAll(@Payload() data: { queryBeltDto: ISearchBeltQuery; paginationDto: IPagination }) {
    const { queryBeltDto, paginationDto } = data;

    return this.beltService.getAll({ queryBeltDto, paginationDto });
  }

  @MessagePattern(BeltPatterns.GetBelt)
  findOne(@Payload() data: { beltId: number }) {
    const { beltId } = data;

    return this.beltService.findOneById(beltId);
  }

  @MessagePattern(BeltPatterns.RemoveBelt)
  remove(@Payload() data: { beltId: number }) {
    const { beltId } = data;

    return this.beltService.removeById(beltId);
  }
}
