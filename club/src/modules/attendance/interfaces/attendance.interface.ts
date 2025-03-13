import { AttendanceStatus } from '../enums/attendance.status.enum';

export interface IStudentAttendance {
  studentId: number;
  note: string;
  status: AttendanceStatus;
}

export interface IRecordAttendance {
  sessionId: number;
  date: string;
  attendances: IStudentAttendance[];
}

export interface ISearchAttendanceQuery {
  search?: string;

  sort_order?: 'asc' | 'desc';
}
