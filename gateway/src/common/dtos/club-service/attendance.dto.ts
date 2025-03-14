import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsDateString, IsEnum, IsInt, IsOptional, IsString, Length, ValidateNested } from 'class-validator';
import { IsDependentOn } from 'src/common/decorators/dependent-fields.decorator';
import { ToArray } from '../../../common/decorators/transformers.decorator';
import { SortOrder } from 'src/common/enums/shared.enum';

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
enum SortBy {
  DATE = 'date',
  CREATED_AT = 'created_at',
  UPDATED_AT = 'updated_at',
}
export class QueryAttendanceDto {
  @IsOptional()
  @ApiProperty({ type: 'string', example: 1 })
  @IsString()
  @ApiPropertyOptional()
  sessionId: string;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({ type: String, example: '' })
  date?: Date;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({ type: String, example: '' })
  start_date?: Date;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({ type: String, example: '' })
  end_date?: Date;

  @IsOptional()
  @IsEnum(SortBy, { message: 'sort_by must be one of "date", "created_at", or "updated_at"' })
  @ApiPropertyOptional({ example: 'birth_date', enum: SortBy })
  sort_by?: SortBy;

  @IsOptional()
  @IsEnum(SortOrder, { message: 'sort_order must be either "asc" or "desc"' })
  @ApiPropertyOptional({ example: 'desc', enum: SortOrder })
  sort_order?: SortOrder;
}
