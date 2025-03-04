import { IsArray, IsDateString, IsInt, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

import { Gender } from 'src/common/enums/shared.enum';
import { ToArray } from 'src/common/decorators/transformers.decorator';

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
  event_place?: string[];

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

export class QueryBeltExamDto {
  //   @IsOptional()
  //   @IsString()
  //   @ApiPropertyOptional({ type: 'string', example: '', description: '' })
  //   search?: string;
  //   @IsOptional()
  //   @IsEnum(Gender)
  //   @ApiPropertyOptional({ example: 'male', enum: Gender })
  //   gender?: Gender;
  //   @IsOptional()
  //   @IsEnum(SortOrder, { message: 'sort_order must be either "asc" or "desc"' })
  //   @ApiPropertyOptional({ example: 'desc', enum: SortOrder })
  //   sort_order?: SortOrder;
}
