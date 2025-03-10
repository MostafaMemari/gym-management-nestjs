import { BeltEntity } from '../entities/belt.entity';
import { BeltName } from '../enums/belt-name.enum';

import { Gender } from '../../../common/enums/gender.enum';

export interface IBeltCreateDto {
  name: BeltName;
  level: number;
  min_age?: number;
  max_age?: number;
  duration_month: number;
  nextBeltIds: number[];
  nextBelt: BeltEntity[];
}

export type IBeltUpdateDto = Partial<IBeltCreateDto>;

export interface IBeltFilter {
  search?: string;
  gender?: Gender;
  sort_order?: 'asc' | 'desc';
}
