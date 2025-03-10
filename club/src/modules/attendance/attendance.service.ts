import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

import { AttendanceRepository } from './repositories/attendance.repository';

import { CacheService } from '../cache/cache.service';

import { Services } from '../../common/enums/services.enum';
import { ServiceResponse } from '../../common/interfaces/serviceResponse.interface';
import { StudentService } from '../student/student.service';
import { ClubService } from '../club/club.service';

@Injectable()
export class AttendanceService {
  constructor(
    private readonly attendanceRepository: AttendanceRepository,
    private readonly cacheService: CacheService,
    private readonly clubService: ClubService,
    private readonly studentService: StudentService,
  ) {}

  async checkUserServiceConnection(): Promise<ServiceResponse | void> {
    // try {
    //   await lastValueFrom(this.userServiceClientProxy.send(UserPatterns.CheckConnection, {}).pipe(timeout(this.timeout)));
    // } catch (error) {
    //   throw new RpcException({ message: 'User service is not connected', status: HttpStatus.INTERNAL_SERVER_ERROR });
    // }
  }
  // async recordAttendance(input: AttendanceInputDto): Promise<void> {
  //   const { sessionId, date, attendances } = input;

  //   const session = await this.sessionRepository.findOne({
  //     where: { id: sessionId },
  //     relations: ['students'],
  //   });

  //   if (!session) {
  //     throw new Error('سانس مورد نظر پیدا نشد');
  //   }

  //   const inputDate = new Date(date);
  //   const dayOfWeek = inputDate.toLocaleString('en-US', { weekday: 'long' }) as DayOfWeek;
  //   if (!session.days.includes(dayOfWeek)) {
  //     throw new Error(`سانس در روز ${dayOfWeek} برگزار نمی‌شود`);
  //   }

  //   let attendanceSession = await this.attendanceSessionRepository.findOne({
  //     where: { sessionId, date: inputDate },
  //   });

  //   if (!attendanceSession) {
  //     attendanceSession = new AttendanceSessionEntity();
  //     attendanceSession.sessionId = sessionId;
  //     attendanceSession.date = inputDate;
  //     await this.attendanceSessionRepository.save(attendanceSession);
  //   }

  //   const validStudentIds = session.students.map((student) => student.id);
  //   const attendanceEntities = attendances
  //     .filter((att) => validStudentIds.includes(att.studentId))
  //     .map((att) => {
  //       const attendance = new AttendanceEntity();
  //       attendance.studentId = att.studentId;
  //       attendance.attendanceSession = attendanceSession;
  //       attendance.status = att.status;
  //       attendance.note = att.note;
  //       attendance.attendanceDateTime = new Date();
  //       return attendance;
  //     });

  //   if (attendanceEntities.length === 0) {
  //     throw new Error('هیچ دانشجوی معتبری برای این سانس پیدا نشد');
  //   }

  //   await this.attendanceRepository.save(attendanceEntities);
  // }

  // async getAttendanceReport(sessionId: number, startDate: string, endDate: string): Promise<AttendanceReportDto> {
  //   const attendanceSessions = await this.attendanceSessionRepository.find({
  //     where: {
  //       sessionId,
  //       date: Between(new Date(startDate), new Date(endDate)),
  //     },
  //     relations: ['attendances', 'attendances.student'],
  //     order: { date: 'ASC' },
  //   });

  //   const report: AttendanceReportDto = attendanceSessions.reduce((acc, session) => {
  //     const dateStr = session.date.toISOString().split('T')[0];
  //     acc[dateStr] = session.attendances.map((att) => ({
  //       studentId: att.studentId,
  //       fullName: att.student.full_name,
  //       status: att.status,
  //       note: att.note,
  //       attendanceDateTime: att.attendanceDateTime.toISOString(),
  //     }));
  //     return acc;
  //   }, {} as AttendanceReportDto);

  //   return report;
  // }
}
