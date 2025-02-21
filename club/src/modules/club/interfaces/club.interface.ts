import { IPagination } from '../../../common/interfaces/pagination.interface';
import { Gender } from '../../../common/enums/gender.enum';

export interface ICreateClub {
  name: string;
  gender: Gender[];
  landline_number?: string;
  address?: string;
}

export type IUpdateClub = Partial<ICreateClub>;

export interface IQuery extends IPagination {}
