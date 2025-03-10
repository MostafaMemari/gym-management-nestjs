import { BeltEntity } from '../../../modules/belt/entities/belt.entity';
import { Gender } from '../../../common/enums/gender.enum';

export interface IBeltCreateDtoExam {
  name: string;
  description?: string;
  genders: Gender[];
  event_place: string[];
  event_date?: Date;
  register_date: Date;
  beltIds: number[];
  belts: BeltEntity[];
}

export type IBeltUpdateDtoExam = Partial<IBeltCreateDtoExam>;

export interface ISearchBeltExamQuery {
  // search?: string;
  // gender?: Gender;
  // sort_order?: 'asc' | 'desc';
}
