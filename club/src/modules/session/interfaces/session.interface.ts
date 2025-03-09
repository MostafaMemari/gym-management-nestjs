import { StudentEntity } from '../../../modules/student/entities/student.entity';
import { DayOfWeek } from '../enums/days-of-week.enum';

export interface ICreateSession {
  days: DayOfWeek[];
  start_time: string;
  end_time: string;
  coachId: number;
  studentIds: number[];
  students: StudentEntity[];
}

export type IUpdateSession = Partial<ICreateSession>;

export interface ISearchSessionQuery {
  search?: string;
  sort_order?: 'asc' | 'desc';
}
