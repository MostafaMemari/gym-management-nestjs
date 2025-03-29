import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { IStudentBulkCreateDto, IStudentCreateDto, IStudentFilter, IStudentUpdateDto } from './interfaces/student.interface';
import { StudentPatterns } from './patterns/student.pattern';
import { StudentService } from './student.service';

import { IPagination } from '../../common/interfaces/pagination.interface';
import { ServiceResponse } from '../../common/interfaces/serviceResponse.interface';
import { IUser } from '../../common/interfaces/user.interface';

@Controller()
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @MessagePattern(StudentPatterns.CHECK_CONNECTION)
  checkConnection() {
    return true;
  }

  @MessagePattern(StudentPatterns.CREATE)
  create(@Payload() data: { user: IUser; createStudentDto: IStudentCreateDto }): Promise<ServiceResponse> {
    const { user, createStudentDto } = data;

    return this.studentService.create(user.id, createStudentDto);
  }
  @MessagePattern(StudentPatterns.UPDATE)
  update(@Payload() data: { user: IUser; studentId: number; updateStudentDto: IStudentUpdateDto }): Promise<ServiceResponse> {
    const { user, studentId, updateStudentDto } = data;

    return this.studentService.update(user.id, studentId, updateStudentDto);
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
  remove(@Payload() data: { user: IUser; studentId: number }): Promise<ServiceResponse> {
    const { user, studentId } = data;

    return this.studentService.removeById(user.id, studentId);
  }

  @MessagePattern(StudentPatterns.BULK_CREATE)
  bulkCreate(
    @Payload() data: { user: IUser; studentData: IStudentBulkCreateDto; studentsJson: Express.Multer.File },
  ): Promise<ServiceResponse> {
    const { user, studentData, studentsJson } = data;

    return this.studentService.bulkCreate(user.id, studentData, studentsJson);
  }
  @MessagePattern(StudentPatterns.GET_BY_NATIONAL_CODE)
  getOneByNationalCode(@Payload() data: { nationalCode: string }): Promise<ServiceResponse> {
    const { nationalCode } = data;

    return this.studentService.getOneByNationalCode(nationalCode);
  }

  @MessagePattern(StudentPatterns.GET_COUNT_BY_OWNER)
  getCountStudentByOwner(@Payload() data: { userId: number }): Promise<ServiceResponse> {
    const { userId } = data;

    return this.studentService.getCountStudentsByOwner(userId);
  }
}
