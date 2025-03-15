import { AttendanceStatus } from '../enums/attendance.status.enum';

export interface IStudentAttendance {
  studentId: number;
  note: string;
  isGusted: true;
  status: AttendanceStatus;
}

export interface IRecordAttendance {
  sessionId: number;
  date: Date;
  attendances: IStudentAttendance[];
}

export type IUpdateRecordAttendance = Partial<IRecordAttendance>;

export interface IAttendanceFilter {
  start_date?: Date;
  end_date?: Date;
  sort_by?: 'date' | 'created_at' | 'updated_at';
  sort_order?: 'asc' | 'desc';
}
