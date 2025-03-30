import { Controller, UseInterceptors } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { ClearCacheInterceptor } from './interceptors/clear-cache.Interceptor';
import { IStudentBulkCreateDto, IStudentCreateDto, IStudentFilter, IStudentUpdateDto } from './interfaces/student.interface';
import { StudentPatterns } from './patterns/student.pattern';
import { StudentService } from './student.service';

import { CacheKeys } from '../../common/enums/cache';
import { Role } from '../../common/enums/role.enum';
import { IPagination } from '../../common/interfaces/pagination.interface';
import { ServiceResponse } from '../../common/interfaces/serviceResponse.interface';
import { IUser } from '../../common/interfaces/user.interface';
import { CacheService } from '../cache/cache.service';

@Controller()
export class StudentController {
  constructor(private readonly studentService: StudentService, private readonly cacheService: CacheService) {}

  @MessagePattern(StudentPatterns.CHECK_CONNECTION)
  checkConnection() {
    return true;
  }

  @MessagePattern(StudentPatterns.CREATE)
  // @UseInterceptors(ClearCacheInterceptor)
  create(@Payload() data: { user: IUser; createStudentDto: IStudentCreateDto }): Promise<ServiceResponse> {
    const { user, createStudentDto } = data;

    return this.studentService.create(user, createStudentDto);
  }

  @MessagePattern(StudentPatterns.UPDATE)
  @UseInterceptors(ClearCacheInterceptor)
  async update(@Payload() data: { user: IUser; studentId: number; updateStudentDto: IStudentUpdateDto }): Promise<ServiceResponse> {
    const { user, studentId, updateStudentDto } = data;

    return await this.studentService.update(user, studentId, updateStudentDto);
  }
  @MessagePattern(StudentPatterns.GET_ONE)
  findOne(@Payload() data: { user: IUser; studentId: number }): Promise<ServiceResponse> {
    const { user, studentId } = data;

    return this.studentService.findOneById(user.id, studentId);
    // return this.studentService.getOneDetails(studentId);
  }
  @MessagePattern(StudentPatterns.GET_ALL)
  findAll(@Payload() data: { user: IUser; queryStudentDto: IStudentFilter; paginationDto: IPagination }): Promise<ServiceResponse> {
    const { user, queryStudentDto, paginationDto } = data;

    return this.studentService.getAll(user.id, { queryStudentDto, paginationDto });
  }
  @MessagePattern(StudentPatterns.GET_ALL_SUMMARY)
  findAllSummary(@Payload() data: { user: IUser; queryStudentDto: IStudentFilter; paginationDto: IPagination }): Promise<ServiceResponse> {
    const { user, queryStudentDto, paginationDto } = data;

    return this.studentService.getAllSummary(user.id, { queryStudentDto, paginationDto });
  }
  @MessagePattern(StudentPatterns.REMOVE)
  @UseInterceptors(ClearCacheInterceptor)
  async remove(@Payload() data: { user: IUser; studentId: number }): Promise<ServiceResponse> {
    const { user, studentId } = data;

    const result = await this.studentService.removeById(user.id, studentId);
    if (!result.error) void this.clearCache(user.id);

    return result;
  }

  @MessagePattern(StudentPatterns.BULK_CREATE)
  bulkCreate(
    @Payload() data: { user: IUser; studentData: IStudentBulkCreateDto; studentsJson: Express.Multer.File },
  ): Promise<ServiceResponse> {
    const { user, studentData, studentsJson } = data;

    return this.studentService.bulkCreate(user.id, studentData, studentsJson);
  }
  @MessagePattern(StudentPatterns.GET_BY_NATIONAL_CODE)
  getByNationalCode(@Payload() data: { nationalCode: string }): Promise<ServiceResponse> {
    const { nationalCode } = data;

    return this.studentService.getOneByNationalCode(nationalCode);
  }

  @MessagePattern(StudentPatterns.GET_COUNT_BY_OWNER)
  getCountStudentByOwner(@Payload() data: { userId: number }): Promise<ServiceResponse> {
    const { userId } = data;

    return this.studentService.getCountStudentsByOwner(userId);
  }

  private async clearCache(ownerId: number) {
    await this.cacheService.delByPattern(`${CacheKeys.STUDENTS}`.replace(':userId', ownerId.toString()) + '*');
    await this.cacheService.delByPattern(`${CacheKeys.STUDENTS_SUMMARY}`.replace(':userId', ownerId.toString()) + '*');
  }
}
