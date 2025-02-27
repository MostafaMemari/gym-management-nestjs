import { IsNotEmpty, IsOptional, IsString, IsEnum, IsPhoneNumber, IsDateString, Length, MinLength, IsInt, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { ToArray, ToBoolean } from '../../../common/decorators/transformers.decorator';
import { Transform } from 'class-transformer';
import { Gender, SortBy, SortOrder } from '../../../common/enums/shared.enum';

export class CreateCoachDto {
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
  @ApiProperty({ example: 'male', enum: Gender })
  gender: Gender;

  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  @ApiPropertyOptional({ type: Boolean, example: true })
  is_active?: boolean;

  @IsOptional()
  @Transform(({ value }) => value?.trim())
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

  @ToArray()
  @IsNotEmpty()
  @IsInt({ each: true })
  @ApiProperty({ isArray: true, example: [1, 2] })
  clubIds: number[];
}

export class UpdateCoachDto extends PartialType(CreateCoachDto) {}

export class QueryCoachDto {
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
  @IsEnum(SortBy, { message: 'sort_by must be one of "birth_date", "sports_insurance_date", "expire_image_date", "created_at", or "updated_at"' })
  @ApiPropertyOptional({ example: 'birth_date', enum: SortBy })
  sort_by?: SortBy;

  @IsOptional()
  @IsEnum(SortOrder, { message: 'sort_order must be either "asc" or "desc"' })
  @ApiPropertyOptional({ example: 'desc', enum: SortOrder })
  sort_order?: SortOrder;
}
