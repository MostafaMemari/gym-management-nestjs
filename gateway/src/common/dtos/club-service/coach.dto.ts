import { IsNotEmpty, IsOptional, IsString, IsEnum, IsPhoneNumber, IsDateString, Length, MinLength, IsInt, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { ToArray, ToBoolean } from '../../../common/decorators/transformers.decorator';
import { Transform } from 'class-transformer';
import { Gender, SortOrder } from '../../../common/enums/shared.enum';

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
    example: '',
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
    example: '',
    minLength: 10,
    maxLength: 10,
  })
  national_code: string;

  @IsOptional()
  @IsPhoneNumber('IR')
  @Transform(({ value }) => value?.trim())
  @ApiProperty({ type: String, example: '' })
  phone_number: string;

  @IsOptional()
  @IsDateString()
  @Transform(({ value }) => value?.trim())
  @ApiPropertyOptional({ type: Date, example: '' })
  birth_date: Date;

  @IsOptional()
  @ToArray()
  @IsInt({ each: true })
  @ApiPropertyOptional({ type: 'array' })
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
  @ApiPropertyOptional({ type: 'string', example: '' })
  phone_number?: string;

  // @IsOptional()
  // @IsString()
  // @ApiPropertyOptional({ type: 'string', example: '' })
  // club: string;

  // @IsOptional()
  // @IsEnum(SortBy, { message: 'sort_by must be one of "birth_date", "sports_insurance_date", "expire_image_date", "created_at", or "updated_at"' })
  // @ApiPropertyOptional({ example: 'birth_date', enum: SortBy })
  // sort_by?: SortBy;

  @IsOptional()
  @IsEnum(SortOrder, { message: 'sort_order must be either "asc" or "desc"' })
  @ApiPropertyOptional({ example: 'desc', enum: SortOrder })
  sort_order?: SortOrder;
}
