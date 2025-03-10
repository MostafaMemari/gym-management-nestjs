import { BadRequestException, forwardRef, HttpStatus, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { lastValueFrom, timeout } from 'rxjs';

import { AttendanceEntity } from './entities/attendance.entity';
import { AttendanceMessages } from './enums/attendance.message';
import { IRecordAttendance, ISearchAttendanceQuery } from './interfaces/attendance.interface';
import { AttendanceRepository } from './repositories/attendance.repository';

import { CacheService } from '../cache/cache.service';
import { CoachService } from '../coach/coach.service';
import { CoachEntity } from '../coach/entities/coach.entity';

import { PageDto, PageMetaDto } from '../../common/dtos/pagination.dto';
import { CacheKeys } from '../../common/enums/cache.enum';
import { Gender } from '../../common/enums/gender.enum';
import { UserPatterns } from '../../common/enums/patterns.events';
import { Services } from '../../common/enums/services.enum';
import { IPagination } from '../../common/interfaces/pagination.interface';
import { ServiceResponse } from '../../common/interfaces/serviceResponse.interface';
import { IUser } from '../../common/interfaces/user.interface';
import { ResponseUtil } from '../../common/utils/response';
import { StudentService } from '../student/student.service';
import { ClubService } from '../club/club.service';

@Injectable()
export class AttendanceService {
  private readonly timeout: number = 4500;

  constructor(
    @Inject(Services.USER) private readonly userServiceClientProxy: ClientProxy,
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
