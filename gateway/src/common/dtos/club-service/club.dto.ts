import { IsNotEmpty, IsOptional, IsString, IsEnum, Length, IsPositive, IsInt } from 'class-validator';
import { Transform } from 'class-transformer';

import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Gender } from '../../enums/gender.enum';

export class CreateClubDto {
  @IsNotEmpty()
  @IsString()
  @Length(2, 120)
  @ApiProperty({ type: String, minLength: 2, maxLength: 120, required: true, example: 'آکادمی تکواندو یاری' })
  name: string;

  @IsNotEmpty()
  @IsEnum(Gender)
  @ApiProperty({ example: 'male', enum: Gender })
  gender: Gender;

  @IsOptional()
  @Length(9, 12)
  @ApiPropertyOptional({ type: String, example: '' })
  landline_number?: string;

  @IsOptional()
  @IsString()
  @Length(10, 200)
  @ApiPropertyOptional({ type: String, maxLength: 100, minLength: 10, required: true, example: '' })
  address?: string;
}

export class UpdateClubDto extends PartialType(CreateClubDto) {}
