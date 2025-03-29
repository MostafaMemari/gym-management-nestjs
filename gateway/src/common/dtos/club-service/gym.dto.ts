import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { Gender, SortOrder } from '../../enums/shared.enum';
import { ToArray } from '../../decorators/transformers.decorator';

export class CreateGymDto {
  @IsNotEmpty()
  @IsString()
  @Length(2, 120)
  @Transform(({ value }) => value?.trim())
  @ApiProperty({
    type: String,
    minLength: 2,
    maxLength: 120,
    required: true,
    example: '',
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

export class UpdateGymDto extends PartialType(CreateGymDto) {}

export class QueryGymDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ type: 'string', example: '', description: '' })
  search?: string;

  @IsOptional()
  @IsEnum(Gender)
  @ApiPropertyOptional({ example: 'male', enum: Gender })
  gender?: Gender;

  @IsOptional()
  @IsEnum(SortOrder, { message: 'sort_order must be either "asc" or "desc"' })
  @ApiPropertyOptional({ example: 'desc', enum: SortOrder })
  sort_order?: SortOrder;
}
