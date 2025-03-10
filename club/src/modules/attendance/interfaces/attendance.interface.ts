import { AttendanceStatus } from '../enums/attendance.status.enum';

export interface IStudentAttendance {
  studentId: number;
  status: AttendanceStatus;
}

export interface IRecordAttendance {
  sessionId: number;
  date: string;
  students: IStudentAttendance[];
}

export interface ISearchAttendanceQuery {
  search?: string;
  sort_order?: 'asc' | 'desc';
}
