import { BeltEntity } from '../../../modules/belt/entities/belt.entity';
import { Gender } from '../../../common/enums/gender.enum';

export interface ICreateBeltExam {
  name: string;
  description: string;
  genders: Gender[];
  event_date?: Date;
  register_date: Date;
  beltIds: number[];
  belts: BeltEntity[];
}

export type IUpdateBeltExam = Partial<ICreateBeltExam>;

export interface ISearchBeltExamQuery {
  // search?: string;
  // gender?: Gender;
  // sort_order?: 'asc' | 'desc';
}
