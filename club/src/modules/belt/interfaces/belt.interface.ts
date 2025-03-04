import { BeltEntity } from '../entities/belt.entity';
import { BeltName } from '../enums/belt.enum';

export interface ICreateBelt {
  name: BeltName;
  level: number;
  min_age?: number;
  max_age?: number;
  duration_month: number;
  nextBeltIds: number[];
  nextBelt: BeltEntity[];
}

export type IUpdateBelt = Partial<ICreateBelt>;

export interface ISearchBeltQuery {
  // search?: string;
  // gender?: Gender;
  // sort_order?: 'asc' | 'desc';
}
