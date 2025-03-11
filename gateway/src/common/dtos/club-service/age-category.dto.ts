import { IsNotEmpty, IsEnum, IsDateString, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

import { AgeCategoryName } from 'src/common/enums/age-category.enum';
import { SortOrder } from 'src/common/enums/shared.enum';

export class CreateAgeCategoryDto {
  @IsNotEmpty()
  @IsEnum(AgeCategoryName)
  @ApiProperty({ example: AgeCategoryName.CADET, enum: AgeCategoryName })
  name: AgeCategoryName;

  @IsNotEmpty()
  @IsDateString()
  @ApiProperty({ type: Date, example: '2025-01-25' })
  start_date: Date;

  @IsNotEmpty()
  @IsDateString()
  @ApiProperty({ type: Date, example: '2025-01-25' })
  end_date: Date;
}

export class UpdateAgeCategoryDto extends PartialType(CreateAgeCategoryDto) {}

enum SortBy {
  START_DATE = 'start_date',
  END_DATE = 'end_date',
  CREATED_AT = 'created_at',
  UPDATED_AT = 'updated_at',
}
export class QueryAgeCategoryDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ type: 'string', example: '', description: '' })
  search?: string;

  @IsOptional()
  @IsEnum(SortBy, { message: 'sort_by must be one of "start_date", "end_date", "created_at" or "updated_at"' })
  @ApiPropertyOptional({ example: 'birth_date', enum: SortBy })
  sort_by?: SortBy;

  @IsOptional()
  @IsEnum(SortOrder, { message: 'sort_order must be either "asc" or "desc"' })
  @ApiPropertyOptional({ example: 'desc', enum: SortOrder })
  sort_order?: SortOrder;
}
