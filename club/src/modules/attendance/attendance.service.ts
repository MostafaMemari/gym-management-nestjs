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
    try {
      await lastValueFrom(this.userServiceClientProxy.send(UserPatterns.CheckConnection, {}).pipe(timeout(this.timeout)));
    } catch (error) {
      throw new RpcException({ message: 'User service is not connected', status: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }
  async create(user: IUser, createAttendanceDto: IRecordAttendance) {
    // try {
    //   const attendance = await this.attendanceRepository.createAndSaveAttendance({ ...createAttendanceDto });
    //   return ResponseUtil.success(attendance, AttendanceMessages.CreatedAttendance);
    // } catch (error) {
    //   return ResponseUtil.error(
    //     error?.message || AttendanceMessages.FailedToCreateAttendance,
    //     error?.status || HttpStatus.INTERNAL_SERVER_ERROR,
    //   );
    // }
  }
  // async update(user: IUser, attendanceId: number, updateAttendanceDto: IUpdateAttendance) {
  //   try {
  //     const attendance = await this.checkAttendanceOwnership(attendanceId);

  //     const updatedAttendance = await this.attendanceRepository.updateAttendance(attendance, updateAttendanceDto);

  //     return ResponseUtil.success({ ...updatedAttendance }, AttendanceMessages.UpdatedAttendance);
  //   } catch (error) {
  //     return ResponseUtil.error(
  //       error?.message || AttendanceMessages.FailedToUpdateAttendance,
  //       error?.status || HttpStatus.INTERNAL_SERVER_ERROR,
  //     );
  //   }
  // }
  async getAll(
    user: IUser,
    query: { queryAttendanceDto: ISearchAttendanceQuery; paginationDto: IPagination },
  ): Promise<PageDto<AttendanceEntity>> {
    const { take, page } = query.paginationDto;

    const cacheKey = `${CacheKeys.CLUB_LIST}-${user.id}-${page}-${take}-${JSON.stringify(query.queryAttendanceDto)}`;

    const cachedData = await this.cacheService.get<PageDto<AttendanceEntity>>(cacheKey);
    if (cachedData) return cachedData;

    const [attendances, count] = await this.attendanceRepository.getAttendancesWithFilters(user.id, query.queryAttendanceDto, page, take);

    const pageMetaDto = new PageMetaDto(count, query?.paginationDto);
    const result = new PageDto(attendances, pageMetaDto);

    await this.cacheService.set(cacheKey, result, 600);

    return result;
  }
  async findOneById(user: IUser, attendanceId: number): Promise<ServiceResponse> {
    try {
      const attendance = await this.checkAttendanceOwnership(attendanceId);

      return ResponseUtil.success(attendance, AttendanceMessages.GetAttendanceSuccess);
    } catch (error) {
      throw new RpcException(error);
    }
  }
  async removeById(user: IUser, attendanceId: number): Promise<ServiceResponse> {
    try {
      const attendance = await this.checkAttendanceOwnership(attendanceId);

      const removedAttendance = await this.attendanceRepository.delete(attendanceId);

      if (removedAttendance.affected) return ResponseUtil.success(attendance, AttendanceMessages.RemovedAttendanceSuccess);

      return ResponseUtil.success(removedAttendance, AttendanceMessages.RemovedAttendanceSuccess);
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async checkAttendanceOwnership(attendanceId: number): Promise<AttendanceEntity> {
    const attendance = await this.attendanceRepository.findByIdAndOwner(attendanceId);
    if (!attendance) throw new NotFoundException(AttendanceMessages.AttendanceNotBelongToUser);
    return attendance;
  }

  async validateOwnedAttendances(attendanceIds: number[], userId: number): Promise<AttendanceEntity[]> {
    const ownedAttendances = await this.attendanceRepository.findOwnedAttendancesByIds(attendanceIds);

    if (ownedAttendances.length !== attendanceIds.length) {
      const notOwnedAttendanceIds = attendanceIds.filter((id) => !ownedAttendances.some((attendance) => attendance.id === id));
      throw new BadRequestException(`${AttendanceMessages.UnauthorizedAttendances} ${notOwnedAttendanceIds.join(', ')}`);
    }

    return ownedAttendances;
  }
}
