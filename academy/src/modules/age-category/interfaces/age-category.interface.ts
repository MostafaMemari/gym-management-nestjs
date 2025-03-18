import { AgeCategoryName } from '../enums/age-category.enum';

export interface IAgeCategoryCreateDto {
  name: AgeCategoryName;
  start_date: Date;
  end_date: Date;
}

export type IAgeCategoryUpdateDto = Partial<IAgeCategoryCreateDto>;

export interface IAgeCategoryFilter {
  search?: string;
  sort_by?: 'start_date' | 'end_date';
  sort_order?: 'asc' | 'desc';
}
