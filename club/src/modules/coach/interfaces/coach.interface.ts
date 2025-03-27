import { Gender } from '../../../common/enums/gender.enum';

export interface ICoachCreateDto {
  full_name: string;
  gender: Gender;
  is_active?: boolean;
  image?: Express.Multer.File;
  father_name?: string;
  national_code: string;
  phone_number?: string;
  birth_date?: Date;
  user_id?: number;
  club_ids?: number[];
}

export type ICoachUpdateDto = Partial<ICoachCreateDto>;

export interface ICoachFilter {
  search?: string;
  gender?: Gender;
  is_active?: boolean;
  phone_number?: string;
  clubIds?: number[];
  sort_by?: 'birth_date' | 'sports_insurance_date' | 'expire_image_date';
  sort_order?: 'asc' | 'desc';
}
