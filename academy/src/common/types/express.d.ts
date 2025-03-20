import { Request } from 'express';
import { IUser } from '../interfaces/user.interface';
import { StudentEntity } from '../../modules/student/entities/student.entity';

declare global {
  namespace Express {
    interface Request {
      data?: {
        user?: IUser;
        student?: StudentEntity;
        studentId?: number;
        coachId?: number;
      };
    }
  }
}
