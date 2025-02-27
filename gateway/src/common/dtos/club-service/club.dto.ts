import { IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { Gender } from '../../../common/enums/shared.enum';

export class CreateClubDto {
  @IsNotEmpty()
  @IsString()
  @Length(2, 120)
  @Transform(({ value }) => value?.trim())
  @ApiProperty({
    type: String,
    minLength: 2,
    maxLength: 120,
    required: true,
    example: 'آکادمی تکواندو یاری',
  })
  name: string;

  @IsNotEmpty()
  @ApiProperty({
    example: [Gender.MALE, Gender.FEMALE],
    enum: Gender,
    isArray: true,
  })
  genders: Gender[];

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
}

export class UpdateClubDto extends PartialType(CreateClubDto) {}
