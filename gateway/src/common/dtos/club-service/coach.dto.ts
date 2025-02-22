import { IsNotEmpty, IsOptional, IsString, IsEnum, IsPhoneNumber, IsDateString, Length, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Gender } from '../../enums/gender.enum';
import { ToArray, ToBoolean } from '../../../common/decorators/transformers.decorator';

export class CreateCoachDto {
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
  @ApiPropertyOptional({ type: String, example: '' })
  expire_image_date?: Date;

  @ToArray()
  @IsNotEmpty()
  @ApiProperty({ isArray: true, example: [1, 2] })
  clubs: string;

  // @ToArray()
  // @ApiProperty()
  // clubs: number;
}

export class UpdateCoachDto extends PartialType(CreateCoachDto) {}
