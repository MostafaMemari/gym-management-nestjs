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
  userId?: number;
  coachId?: number;
  clubId?: number;
}

export type IUpdateStudent = Partial<ICreateStudent>;

export interface IStudentQuery extends IPagination {}
