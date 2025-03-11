import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { IPagination } from '../../common/interfaces/pagination.interface';
import { IAgeCategoryCreateDto, IAgeCategoryFilter, IAgeCategoryUpdateDto } from './interfaces/age-category.interface';

import { AgeCategoryService } from './age-category.service';
import { AgeCategoryPatterns } from './patterns/age-category.pattern';

@Controller()
export class AgeCategoryController {
  constructor(private readonly ageCategoryService: AgeCategoryService) {}

  @MessagePattern(AgeCategoryPatterns.CHECK_CONNECTION)
  checkConnection() {
    return true;
  }

  @MessagePattern(AgeCategoryPatterns.CREATE)
  create(@Payload() data: { createAgeCategoryDto: IAgeCategoryCreateDto }) {
    const { createAgeCategoryDto } = data;

    return this.ageCategoryService.create(createAgeCategoryDto);
  }
  @MessagePattern(AgeCategoryPatterns.UPDATE)
  update(@Payload() data: { ageCategoryId: number; updateAgeCategoryDto: IAgeCategoryUpdateDto }) {
    const { ageCategoryId, updateAgeCategoryDto } = data;

    return this.ageCategoryService.update(ageCategoryId, updateAgeCategoryDto);
  }

  @MessagePattern(AgeCategoryPatterns.GET_ALL)
  findAll(@Payload() data: { queryAgeCategoryDto: IAgeCategoryFilter; paginationDto: IPagination }) {
    const { queryAgeCategoryDto, paginationDto } = data;

    return this.ageCategoryService.getAll({ queryAgeCategoryDto, paginationDto });
  }

  @MessagePattern(AgeCategoryPatterns.GET_ONE)
  findOne(@Payload() data: { ageCategoryId: number }) {
    const { ageCategoryId } = data;

    return this.ageCategoryService.findOneById(ageCategoryId);
  }

  @MessagePattern(AgeCategoryPatterns.REMOVE)
  remove(@Payload() data: { ageCategoryId: number }) {
    const { ageCategoryId } = data;

    return this.ageCategoryService.removeById(ageCategoryId);
  }
}
