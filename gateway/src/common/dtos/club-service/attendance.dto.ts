import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsEnum, IsInt, ValidateNested } from 'class-validator';

export enum AttendanceStatus {
  PRESENT = 'present',
  ABSENT = 'absent',
  LATE = 'late',
}

export class StudentAttendanceDto {
  @ApiProperty({ example: 101, description: 'شناسه هنرجو' })
  @IsInt()
  studentId: number;

  @ApiProperty({
    example: AttendanceStatus.PRESENT,
    description: 'وضعیت حضور هنرجو',
    enum: AttendanceStatus,
  })
  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;
}

export class RecordAttendanceDto {
  @ApiProperty({ example: 1, description: 'شناسه سانس' })
  @IsInt()
  sessionId: number;

  @ApiProperty({ example: '2025-03-10', description: 'YYYY-MM-DD' })
  @IsDateString()
  date: string;

  @ApiProperty({
    type: [StudentAttendanceDto],
    description: 'لیست هنرجویان و وضعیت حضور آن‌ها',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StudentAttendanceDto)
  students: StudentAttendanceDto[];
}
