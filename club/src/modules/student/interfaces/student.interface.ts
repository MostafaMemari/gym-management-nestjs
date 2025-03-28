import { Gender } from '../../../common/enums/gender.enum';

export interface IStudentCreateDto {
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
  coach_id?: number;
  gym_id?: number;
  belt_id?: number;
}

export type IStudentUpdateDto = Partial<IStudentCreateDto>;

export interface IStudentBulkCreateDto extends Pick<IStudentCreateDto, 'gym_id' | 'coach_id' | 'gender'> {}

export interface IStudentFilter {
  search?: string;
  gender?: Gender;
  is_active?: boolean;
  phone_number?: string;
  expire_image_date?: string;
  coach_id?: string;
  gym_id?: string;
  belt_ids?: number[];
  age_category_ids: number[];
  sort_by?: 'birth_date' | 'sports_insurance_date' | 'expire_image_date';
  sort_order?: 'asc' | 'desc';
}
