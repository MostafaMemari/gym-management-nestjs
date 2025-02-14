import { Gender } from '../enums/gender.enum';

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
  coach_id?: string;
  club_id?: string;
  age_category_id?: string;
}

export interface IPagination {
  paginationDto: {
    page?: number;
    take?: number;
    skip?: number;
  };
}

export interface ISearchQuery {
  query: string;
}

export interface IQuery extends IPagination, ISearchQuery {}
