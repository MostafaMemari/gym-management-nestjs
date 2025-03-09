import { IsDateString, IsEnum, IsInt, IsNotEmpty, IsOptional, IsPositive, IsString, Length } from 'class-validator';

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
  @IsDateString()
  @ApiPropertyOptional({ type: Date, example: '' })
  start_time: Date;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({ type: Date, example: '' })
  end_time: Date;

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
