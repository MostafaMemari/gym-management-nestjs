import { IsDateString, IsEnum, IsInt, IsNotEmpty, IsOptional, IsPositive, IsString, Length, Matches } from 'class-validator';

import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { SortOrder } from '../../enums/shared.enum';
import { DayOfWeek } from '../../../common/enums/days-of-week.enum';
import { ToArray } from '../../../common/decorators/transformers.decorator';

export class CreateSessionDto {
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
  @IsInt()
  @IsPositive()
  @Transform(({ value }) => parseInt(value, 10))
  @ApiProperty({ type: 'integer', required: true, example: '' })
  clubId: number;

  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  @Transform(({ value }) => parseInt(value, 10))
  @ApiProperty({ type: 'integer', required: true, example: '' })
  coachId: number;

  @IsNotEmpty()
  @ToArray()
  @IsInt({ each: true })
  @ApiProperty({ type: 'array' })
  studentIds: number[];
}

export class UpdateSessionDto extends PartialType(CreateSessionDto) {}

export class QuerySessionDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ type: 'string', example: '', description: '' })
  search?: string;

  @IsOptional()
  @IsEnum(SortOrder, { message: 'sort_order must be either "asc" or "desc"' })
  @ApiPropertyOptional({ example: 'desc', enum: SortOrder })
  sort_order?: SortOrder;
}
