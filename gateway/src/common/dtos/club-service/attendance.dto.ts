import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsDateString, IsEnum, IsInt, IsOptional, IsString, Length, ValidateNested } from 'class-validator';
import { ToArray } from 'src/common/decorators/transformers.decorator';

export enum AttendanceStatus {
  PRESENT = 'present',
  ABSENT = 'absent',
  LATE = 'late',
}

export class StudentAttendanceDto {
  @ApiProperty({ type: 'string', example: 101 })
  @IsString()
  studentId: string;

  @ApiProperty({ example: AttendanceStatus.PRESENT, enum: AttendanceStatus })
  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;
}

export class RecordAttendanceDto {
  @ApiProperty({ type: 'string', example: 1 })
  @IsString()
  sessionId: string;

  @ApiProperty({ example: '2025-03-10', description: 'YYYY-MM-DD' })
  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  @Length(5, 255)
  @Transform(({ value }) => value?.trim())
  @ApiPropertyOptional({
    type: String,
    minLength: 5,
    maxLength: 255,
    required: true,
    example: '',
  })
  note: string;

  @Type(() => StudentAttendanceDto)
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @ApiProperty({ type: [StudentAttendanceDto] })
  attendances: StudentAttendanceDto[];
}
