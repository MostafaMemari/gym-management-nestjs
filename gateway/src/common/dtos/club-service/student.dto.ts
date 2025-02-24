import { Transform } from 'class-transformer';
import {
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
import { Gender } from '../../enums/gender.enum';

export class CreateStudentDto {
  @IsNotEmpty()
  @IsString()
  @Length(5, 80)
  @Transform(({ value }) => value?.trim())
  @ApiProperty({
    type: String,
    minLength: 5,
    maxLength: 80,
    required: true,
    example: 'مصطفی معماری',
  })
  full_name: string;

  @IsNotEmpty()
  @IsEnum(Gender)
  @Transform(({ value }) => value?.trim())
  @ApiProperty({ example: 'male', enum: Gender })
  gender: Gender;

  @IsOptional()
  @ToBoolean()
  @Transform(({ value }) => value?.trim())
  @ApiPropertyOptional({ type: Boolean, example: true })
  is_active?: boolean;

  @IsOptional()
  @ApiPropertyOptional({ type: 'string', format: 'binary' })
  image?: string;

  @IsOptional()
  @IsString()
  @Length(2, 80)
  @Transform(({ value }) => value?.trim())
  @ApiPropertyOptional({
    type: String,
    maxLength: 80,
    minLength: 2,
    required: true,
    example: '',
  })
  father_name?: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(10)
  @Transform(({ value }) => value?.trim())
  @ApiProperty({
    type: String,
    example: '4900782343',
    minLength: 10,
    maxLength: 10,
  })
  national_code: string;

  @IsOptional()
  @IsPhoneNumber('IR')
  @Transform(({ value }) => value?.trim())
  @ApiPropertyOptional({ type: String, example: '09388366510' })
  phone_number: string;

  @IsOptional()
  @Length(9, 12)
  @Transform(({ value }) => value?.trim())
  @ApiPropertyOptional({ type: String, example: '' })
  landline_number?: string;

  @IsOptional()
  @IsString()
  @Length(10, 200)
  @Transform(({ value }) => value?.trim())
  @ApiPropertyOptional({
    type: String,
    maxLength: 100,
    minLength: 10,
    required: true,
    example: '',
  })
  address?: string;

  @IsNotEmpty()
  @IsDateString()
  @Transform(({ value }) => value?.trim())
  @ApiProperty({ type: Date, example: '2025-01-25' })
  birth_date: Date;

  @IsOptional()
  @IsDateString()
  @Transform(({ value }) => value?.trim())
  @ApiPropertyOptional({ type: Date, example: '' })
  sports_insurance_date?: Date;

  @IsOptional()
  @IsDateString()
  @Transform(({ value }) => value?.trim())
  @ApiPropertyOptional({ type: String, example: '' })
  expire_image_date?: Date;

  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  @ApiProperty({ type: 'integer', required: true, example: '' })
  coachId: string;

  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  @ApiProperty({ type: 'integer', required: true, example: '' })
  clubId: string;
}

export class UpdateStudentDto extends PartialType(CreateStudentDto) {}
