import { AgeCategoryName } from '../enums/age-category.enum';
import { Gender } from '../../../common/enums/gender.enum';

export interface IAgeCategoryCreateDto {
  name: AgeCategoryName;
  start_date: Date;
  end_date: Date;
}

export type IAgeCategoryUpdateDto = Partial<IAgeCategoryCreateDto>;

export interface IAgeCategoryFilter {
  search?: string;
  gender?: Gender;
  sort_order?: 'asc' | 'desc';
}
