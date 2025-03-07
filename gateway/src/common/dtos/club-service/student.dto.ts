import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsPositive,
  IsString,
  Length,
  MinLength,
} from 'class-validator';

import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { ToBoolean } from '../../../common/decorators/transformers.decorator';
import { Gender, SortBy, SortOrder } from '../../../common/enums/shared.enum';
import { IsDependentOn } from '../../../common/decorators/dependent-fields.decorator';

export class CreateStudentDto {
  @IsNotEmpty()
  @IsString()
  @Length(5, 80)
  @ApiProperty({ type: String, minLength: 5, maxLength: 80, required: true, example: 'مصطفی معماری' })
  full_name: string;

  @IsNotEmpty()
  @IsEnum(Gender)
  @ApiProperty({ example: 'male', enum: Gender })
  gender: Gender;

  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  @ApiPropertyOptional({ type: Boolean, example: true })
  is_active?: boolean;

  @IsOptional()
  @ApiPropertyOptional({ type: 'string', format: 'binary' })
  image?: string;

  @IsOptional()
  @IsString()
  @Length(2, 80)
  @ApiPropertyOptional({ type: String, maxLength: 80, minLength: 2, required: true, example: '' })
  father_name?: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(10)
  @ApiProperty({ type: String, example: '4900782343', minLength: 10, maxLength: 10 })
  national_code: string;

  @IsOptional()
  @IsPhoneNumber('IR')
  @ApiPropertyOptional({ type: String, example: '09388366510' })
  phone_number: string;

  @IsOptional()
  @Length(9, 12)
  @ApiPropertyOptional({ type: String, example: '' })
  landline_number?: string;

  @IsOptional()
  @IsString()
  @Length(10, 200)
  @ApiPropertyOptional({ type: String, maxLength: 100, minLength: 10, required: true, example: '' })
  address?: string;

  @IsNotEmpty()
  @IsDateString()
  @ApiProperty({ type: Date, example: '2025-01-25' })
  birth_date: Date;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({ type: Date, example: '' })
  sports_insurance_date?: Date;

  @IsOptional()
  @IsDateString()
  @Transform(({ value }) => value?.trim())
  @ApiPropertyOptional({ type: String, example: '' })
  expire_image_date?: Date;

  @IsOptional()
  @IsDateString()
  @IsDependentOn('beltId')
  @ApiPropertyOptional({ type: String, example: '' })
  belt_date?: Date;

  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  @Transform(({ value }) => parseInt(value, 10))
  @ApiProperty({ type: 'integer', required: true, example: '' })
  coachId: number;

  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  @Transform(({ value }) => parseInt(value, 10))
  @ApiProperty({ type: 'integer', required: true, example: '' })
  clubId: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  @Transform(({ value }) => parseInt(value, 10))
  @IsDependentOn('belt_date')
  @ApiPropertyOptional({ type: 'integer', required: true, example: '' })
  beltId?: number;
}

export class UpdateStudentDto extends PartialType(CreateStudentDto) {}

export class QueryStudentDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ type: 'string', example: '', description: 'search full name and national code' })
  search?: string;

  @IsOptional()
  @IsEnum(Gender)
  @ApiPropertyOptional({ example: 'male', enum: Gender })
  gender?: Gender;

  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  @ApiPropertyOptional({ type: Boolean, example: true })
  is_active?: boolean;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ type: 'string', example: '09388366510' })
  phone_number?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ type: 'string', example: '' })
  coach: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ type: 'string', example: '' })
  club: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ type: 'string', example: '' })
  belt: string;

  @IsOptional()
  @IsEnum(SortBy, { message: 'sort_by must be one of "birth_date", "sports_insurance_date", "expire_image_date", "created_at", or "updated_at"' })
  @ApiPropertyOptional({ example: 'birth_date', enum: SortBy })
  sort_by?: SortBy;

  @IsOptional()
  @IsEnum(SortOrder, { message: 'sort_order must be either "asc" or "desc"' })
  @ApiPropertyOptional({ example: 'desc', enum: SortOrder })
  sort_order?: SortOrder;
}
