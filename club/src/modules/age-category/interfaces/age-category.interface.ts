import { AgeCategoryName } from '../enums/age-category.enum';

export interface ICreateAgeCategory {
  name: AgeCategoryName;
  start_date: Date;
  end_date: Date;
}

export type IUpdateAgeCategory = Partial<ICreateAgeCategory>;

export interface ISearchAgeCategoryQuery {
  // search?: string;
  // gender?: Gender;
  // sort_order?: 'asc' | 'desc';
}
