import { BeltEntity } from '../../../modules/belt/entities/belt.entity';
import { Gender } from '../../../common/enums/gender.enum';

export interface IBeltExamCreateDto {
  name: string;
  description?: string;
  genders: Gender[];
  event_place: string[];
  event_date?: Date;
  register_date: Date;
  beltIds: number[];
  belts: BeltEntity[];
}

export type IBeltExamUpdateDto = Partial<IBeltExamCreateDto>;

export interface IBeltExamFilter {
  search?: string;
  gender?: Gender;
  event_places?: string[];
  belt_ids?: number[];
  sort_by: 'register_date' | 'event_date' | 'created_at' | 'updated_at';
  sort_order?: 'asc' | 'desc';
}
