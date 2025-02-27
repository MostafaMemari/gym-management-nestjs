import { Gender } from '../../../common/enums/gender.enum';

export interface ICreateCoach {
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
  clubIds?: number[];
}

export type IUpdateCoach = Partial<ICreateCoach>;

export interface ISeachCoachQuery {
  search?: string;
  gender?: Gender;
  is_active?: boolean;
  phone_number?: string;
  clubIds?: number[];
  sort_by?: 'birth_date' | 'sports_insurance_date' | 'expire_image_date';
  sort_order?: 'asc' | 'desc';
}
