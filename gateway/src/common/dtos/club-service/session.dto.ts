import { IsDateString, IsEnum, IsInt, IsNotEmpty, IsOptional, IsPositive, IsString, Length, Matches } from 'class-validator';

import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { SortOrder } from '../../enums/shared.enum';
import { DayOfWeek } from '../../../common/enums/days-of-week.enum';
import { ToArray } from '../../../common/decorators/transformers.decorator';

export class CreateSessionDto {
  @IsNotEmpty()
  @IsString()
  @Length(2, 120)
  @Transform(({ value }) => value?.trim())
  @ApiProperty({
    type: String,
    minLength: 2,
    maxLength: 120,
    required: true,
    example: '',
  })
  name: string;

  @IsOptional()
  @ApiPropertyOptional({
    example: [DayOfWeek.FRIDAY, DayOfWeek.WEDNESDAY],
    enum: DayOfWeek,
    isArray: true,
  })
  days: DayOfWeek[];

  @IsOptional()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'start_time must be in HH:MM format (00:00 to 23:59)',
  })
  @ApiPropertyOptional({ type: String, example: '00:00' })
  start_time: string;

  @IsOptional()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'end_time must be in HH:MM format (00:00 to 23:59)',
  })
  @ApiPropertyOptional({ type: String, example: '23:59' })
  end_time: string;

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
  description: string;

  @IsNotEmpty()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @IsPositive()
  @ApiProperty({ type: 'number', example: '' })
  clubId: number;

  @IsNotEmpty()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @IsPositive()
  @ApiProperty({ type: 'number', example: '' })
  coachId: number;

  @IsOptional()
  @ToArray()
  @IsInt({ each: true })
  @ApiPropertyOptional({ type: 'array' })
  studentIds: number[];
}

export class UpdateSessionDto extends PartialType(CreateSessionDto) {}

enum SortBy {
  START_TIME = 'start_time',
  END_TIME = 'end_time',
  CREATED_AT = 'created_at',
  UPDATED_AT = 'updated_at',
}
export class QuerySessionDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ type: 'string', example: '', description: '' })
  search?: string;

  @IsOptional()
  @IsEnum(SortBy, { message: 'sort_by must be one of "start_time", "end_time", "created_at", or "updated_at"' })
  @ApiPropertyOptional({ example: 'start_time', enum: SortBy })
  sort_by?: SortBy;

  @IsOptional()
  @IsEnum(SortOrder, { message: 'sort_order must be either "asc" or "desc"' })
  @ApiPropertyOptional({ example: 'desc', enum: SortOrder })
  sort_order?: SortOrder;
}
