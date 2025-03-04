import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { ICreateAgeCategory, IUpdateAgeCategory, ISearchAgeCategoryQuery } from './interfaces/age-category.interface';

import { IPagination } from '../../common/interfaces/pagination.interface';
import { AgeCategoryService } from './age-category.service';
import { AgeCategoryPatterns } from './patterns/age-category.pattern';

@Controller()
export class AgeCategoryController {
  constructor(private readonly ageCategoryService: AgeCategoryService) {}

  @MessagePattern(AgeCategoryPatterns.CheckConnection)
  checkConnection() {
    return true;
  }

  @MessagePattern(AgeCategoryPatterns.CreateAgeCategory)
  create(@Payload() data: { createAgeCategoryDto: ICreateAgeCategory }) {
    const { createAgeCategoryDto } = data;

    return this.ageCategoryService.create(createAgeCategoryDto);
  }
  @MessagePattern(AgeCategoryPatterns.UpdateAgeCategory)
  update(@Payload() data: { ageCategoryId: number; updateAgeCategoryDto: IUpdateAgeCategory }) {
    const { ageCategoryId, updateAgeCategoryDto } = data;

    return this.ageCategoryService.update(ageCategoryId, updateAgeCategoryDto);
  }

  @MessagePattern(AgeCategoryPatterns.GetAgeCategories)
  findAll(@Payload() data: { queryAgeCategoryDto: ISearchAgeCategoryQuery; paginationDto: IPagination }) {
    const { queryAgeCategoryDto, paginationDto } = data;

    return this.ageCategoryService.getAll({ queryAgeCategoryDto, paginationDto });
  }

  @MessagePattern(AgeCategoryPatterns.GetAgeCategory)
  findOne(@Payload() data: { ageCategoryId: number }) {
    const { ageCategoryId } = data;

    return this.ageCategoryService.findOneById(ageCategoryId);
  }

  @MessagePattern(AgeCategoryPatterns.RemoveAgeCategory)
  remove(@Payload() data: { ageCategoryId: number }) {
    const { ageCategoryId } = data;

    return this.ageCategoryService.removeById(ageCategoryId);
  }
}
