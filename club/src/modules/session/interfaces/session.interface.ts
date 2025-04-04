import { StudentEntity } from '../../../modules/student/entities/student.entity';
import { DayOfWeek } from '../enums/days-of-week.enum';

export interface ICreateSession {
  name: string;
  days: DayOfWeek[];
  description: string;
  start_time: string;
  end_time: string;
  gymId: number;
  coachId: number;
  studentIds?: number[];
  students: StudentEntity[];
}

export type IUpdateSession = Partial<ICreateSession>;

export interface ISessionFilter {
  search?: string;
  sort_by?: 'start_time' | 'end_time' | 'created_at' | 'updated_at';
  sort_order?: 'asc' | 'desc';
}
