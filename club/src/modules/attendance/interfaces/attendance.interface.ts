import { AttendanceStatus } from '../enums/attendance.status.enum';

export interface IStudentAttendance {
  studentId: number;
  note: string;
  status: AttendanceStatus;
}

export interface IRecordAttendanceDto {
  sessionId: number;
  date: Date;
  attendances: IStudentAttendance[];
}

export type IUpdateRecordAttendance = Partial<IRecordAttendanceDto>;

export interface IAttendanceFilter {
  start_date?: Date;
  end_date?: Date;
  sort_by?: 'date' | 'created_at' | 'updated_at';
  sort_order?: 'asc' | 'desc';
}
