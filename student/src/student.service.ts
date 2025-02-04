import { HttpStatus, Injectable } from '@nestjs/common';
import { ICreateStudent } from './common/interfaces/student.interface';
import { StudentMessages } from './common/enums/student.messages';

@Injectable()
export class StudentService {
  createStudent(data: ICreateStudent) {
    return {
      data: { data },
      error: false,
      message: StudentMessages.CreatedStudent,
      status: HttpStatus.CREATED,
    };
  }
}
