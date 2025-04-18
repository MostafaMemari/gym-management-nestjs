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
  Max,
  Min,
  MinLength,
} from 'class-validator';

import { ApiProperty, ApiPropertyOptional, OmitType, PartialType, PickType } from '@nestjs/swagger';
import { ToArray, ToBoolean } from '../../../common/decorators/transformers.decorator';
import { Gender, SortOrder } from '../../../common/enums/shared.enum';
import { IsDependentOn } from '../../../common/decorators/dependent-fields.decorator';

export class CreateStudentByAdminDto {
  @IsNotEmpty()
  @IsString()
  @Length(5, 80)
  @ApiProperty({ type: String, minLength: 5, maxLength: 80, required: true, example: 'مصطفی معماری' })
  full_name: string;

  @IsNotEmpty()
  @IsEnum(Gender)
  @ApiProperty({ example: 'male', enum: Gender })
  gender: Gender;

  @IsNotEmpty()
  @IsString()
  @MinLength(10)
  @ApiProperty({ type: String, example: '', minLength: 10, maxLength: 10 })
  national_code: string;

  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  @ApiPropertyOptional({ type: Boolean, example: true })
  is_active?: boolean;

  @IsOptional()
  @ApiPropertyOptional({ type: 'string', format: 'binary' })
  image?: Express.Multer.File;

  @IsOptional()
  @IsString()
  @Length(2, 80)
  @ApiPropertyOptional({ type: String, maxLength: 80, minLength: 2, required: true, example: '' })
  father_name?: string;

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

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({ type: Date, example: '2025-01-25' })
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
  @IsInt()
  @Min(1371)
  @Max(1449)
  @Transform(({ value }) => (value !== null && value !== undefined ? parseInt(value, 10) : null))
  @ApiPropertyOptional({ type: 'integer', required: false, example: 1402 })
  membership_year?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  @Transform(({ value }) => parseInt(value, 10))
  @ApiPropertyOptional({ type: 'integer', required: true, example: '' })
  coach_id: number;

  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  @Transform(({ value }) => parseInt(value, 10))
  @ApiProperty({ type: 'integer', required: true, example: '' })
  gym_id: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  @Transform(({ value }) => parseInt(value, 10))
  @IsDependentOn('belt_date')
  @ApiPropertyOptional({ type: 'integer', required: true, example: '' })
  belt_id?: number;

  @IsOptional()
  @IsDateString()
  @IsDependentOn('beltId')
  @ApiPropertyOptional({ type: String, example: '' })
  belt_date?: Date;
}

export class CreateStudentByCoachDto extends OmitType(CreateStudentByAdminDto, ['coach_id']) {}

export class UpdateStudentByAdminDto extends PartialType(OmitType(CreateStudentByAdminDto, ['belt_id', 'belt_date'])) {}
export class UpdateStudentByCoachDto extends PartialType(OmitType(CreateStudentByCoachDto, ['belt_id', 'belt_date'])) {}

export class BulkCreateStudentsByAdminDto extends PickType(CreateStudentByAdminDto, ['gender', 'coach_id', 'gym_id']) {
  @IsOptional()
  @ApiPropertyOptional({ type: 'string', format: 'binary' })
  studentsFile?: string;
}
export class BulkCreateStudentsByCoachDto extends PickType(CreateStudentByAdminDto, ['gender', 'gym_id']) {
  @IsOptional()
  @ApiPropertyOptional({ type: 'string', format: 'binary' })
  studentsFile?: string;
}

enum SortBy {
  BIRTH_DATE = 'birth_date',
  SPORTS_INSURANCE_DATE = 'sports_insurance_date',
  EXPIRE_IMAGE_DATE = 'expire_image_date',
  CREATED_AT = 'created_at',
  UPDATED_AT = 'updated_at',
}
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
  @ApiPropertyOptional({ type: 'string', example: '' })
  phone_number?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ type: 'string', example: '' })
  coach_id: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ type: 'string', example: '' })
  gym_id: string;

  @IsOptional()
  @ToArray()
  @IsInt({ each: true })
  @ApiPropertyOptional({ type: 'array' })
  belt_ids: number[];

  @IsOptional()
  @ToArray()
  @IsInt({ each: true })
  @ApiPropertyOptional({ type: 'array' })
  age_category_ids: number[];

  @IsOptional()
  @IsEnum(SortBy, { message: 'sort_by must be one of "birth_date", "sports_insurance_date", "expire_image_date", "created_at", or "updated_at"' })
  @ApiPropertyOptional({ example: 'birth_date', enum: SortBy })
  sort_by?: SortBy;

  @IsOptional()
  @IsEnum(SortOrder, { message: 'sort_order must be either "asc" or "desc"' })
  @ApiPropertyOptional({ example: 'desc', enum: SortOrder })
  sort_order?: SortOrder;
}
