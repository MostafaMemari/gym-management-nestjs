import { Gender } from '../../../common/enums/gender.enum';

export interface ICreateGym {
  id: number;
  name: string;
  genders: Gender[];
  landline_number?: string;
  address?: string;
}

export type IUpdateGym = Partial<ICreateGym>;

export interface ISearchGymQuery {
  search?: string;
  gender?: Gender;
  sort_order?: 'asc' | 'desc';
}
