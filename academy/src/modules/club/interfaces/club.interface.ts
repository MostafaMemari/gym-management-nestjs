import { IPagination } from '../../../common/interfaces/pagination.interface';
import { Gender } from '../../../common/enums/gender.enum';

export interface ICreateClub {
  id: number;
  name: string;
  genders: Gender[];
  landline_number?: string;
  address?: string;
}

export type IUpdateClub = Partial<ICreateClub>;

export interface ISearchClubQuery {
  search?: string;
  gender?: Gender;
  sort_order?: 'asc' | 'desc';
}
