import { BeltEntity } from '../entities/belt.entity';
import { BeltName } from '../enums/belt-name.enum';

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
  sort_by?: 'level' | 'created_at' | 'updated_at';
  sort_order?: 'asc' | 'desc';
}
