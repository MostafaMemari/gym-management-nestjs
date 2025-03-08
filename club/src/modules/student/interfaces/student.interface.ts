import { IPagination } from '../../../common/interfaces/pagination.interface';
import { Gender } from '../../../common/enums/gender.enum';

export interface ICreateStudent {
  full_name: string;
  gender: Gender;
  is_active?: boolean;
  image?: Express.Multer.File;
  father_name?: string;
  national_code: string;
  phone_number?: string;
  landline_number?: string;
  address?: string;
  birth_date: Date;
  sports_insurance_date?: Date;
  expire_image_date?: Date;
  belt_date?: Date;
  membership_year?: number;
  userId?: number;
  coachId?: number;
  clubId?: number;
  beltId?: number;
}

export type IUpdateStudent = Partial<ICreateStudent>;

export interface IBulkCreateStudent extends Pick<ICreateStudent, 'clubId' | 'coachId' | 'gender'> {}

export interface ISeachStudentQuery {
  search?: string;
  gender?: Gender;
  is_active?: boolean;
  phone_number?: string;
  expire_image_date?: string;
  coach?: string;
  club?: string;
  belt?: string;
  sort_by?: 'birth_date' | 'sports_insurance_date' | 'expire_image_date';
  sort_order?: 'asc' | 'desc';
}
