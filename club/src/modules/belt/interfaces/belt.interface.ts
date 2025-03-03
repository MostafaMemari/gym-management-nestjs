import { BeltName } from '../enums/belt.enum';

export interface ICreateBelt {
  name: BeltName;
  level: number;
  min_age?: number;
  max_age?: number;
  duration_month: number;
}

export type IUpdateBelt = Partial<ICreateBelt>;

export interface ISearchBeltQuery {
  // search?: string;
  // gender?: Gender;
  // sort_order?: 'asc' | 'desc';
}
