import { IsArray, IsDateString, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

import { Gender, SortOrder } from '../../../common/enums/shared.enum';
import { ToArray } from '../../../common/decorators/transformers.decorator';

export class CreateBeltExamDto {
  @IsNotEmpty()
  @IsString()
  @Length(1, 120)
  @Transform(({ value }) => value?.trim())
  @ApiProperty({
    type: String,
    minLength: 1,
    maxLength: 120,
    required: true,
    example: '',
  })
  name: string;

  @IsOptional()
  @IsString()
  @Length(5, 120)
  @Transform(({ value }) => value?.trim())
  @ApiPropertyOptional({
    type: String,
    minLength: 5,
    maxLength: 120,
    required: true,
    example: '',
  })
  description: string;

  @IsNotEmpty()
  @ApiProperty({
    example: [Gender.MALE, Gender.FEMALE],
    enum: Gender,
    isArray: true,
  })
  genders: Gender[];

  @IsNotEmpty()
  @ToArray()
  @IsArray()
  @ApiProperty({ example: [''] })
  event_places?: string[];

  @IsNotEmpty()
  @IsDateString()
  @ApiProperty({ type: Date, example: '2025-01-25' })
  register_date: Date;

  @IsNotEmpty()
  @IsDateString()
  @ApiProperty({ type: Date, example: '2025-01-25' })
  event_date: Date;

  @IsNotEmpty()
  @ToArray()
  @IsInt({ each: true })
  @ApiProperty({ type: 'array' })
  beltIds: number[];
}

export class UpdateBeltExamDto extends PartialType(CreateBeltExamDto) {}

enum SortBy {
  REGISTER_DATE = 'register_date',
  EVENT_DATE = 'event_date',
  CREATED_AT = 'created_at',
  UPDATED_AT = 'updated_at',
}

export class QueryBeltExamDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ type: 'string', example: '', description: '' })
  search?: string;

  @IsOptional()
  @IsEnum(Gender)
  @ApiPropertyOptional({ example: 'male', enum: Gender })
  gender?: Gender;

  @IsOptional()
  @ToArray()
  @IsArray()
  @ApiPropertyOptional({ example: [''] })
  event_places?: string[];

  @IsOptional()
  @ToArray()
  @IsInt({ each: true })
  @ApiPropertyOptional({ type: 'array' })
  belt_ids?: number[];

  @IsOptional()
  @IsEnum(SortBy, { message: 'sort_by must be one of "register_date", "event_date", "created_at" or "updated_at"' })
  @ApiPropertyOptional({ example: 'birth_date', enum: SortBy })
  sort_by?: SortBy;

  @IsOptional()
  @IsEnum(SortOrder, { message: 'sort_order must be either "asc" or "desc"' })
  @ApiPropertyOptional({ example: 'desc', enum: SortOrder })
  sort_order?: SortOrder;
}
