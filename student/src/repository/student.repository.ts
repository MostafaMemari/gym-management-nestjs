import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudentEntity } from '../entities/student.entity';

@Injectable()
export class StudentRepository {
  constructor(
    @InjectRepository(StudentEntity)
    private readonly studentRepo: Repository<StudentEntity>,
  ) {}

  async findById(studentId: number): Promise<StudentEntity | null> {
    return this.studentRepo.findOne({ where: { id: studentId } });
  }

  async findByNationalCode(nationalCode: string): Promise<StudentEntity | null> {
    return this.studentRepo.findOne({ where: { national_code: nationalCode } });
  }

  async saveStudent(student: Partial<StudentEntity>): Promise<StudentEntity> {
    return this.studentRepo.save(student);
  }

  async deleteStudentById(studentId: number): Promise<void> {
    await this.studentRepo.delete(studentId);
  }
}
