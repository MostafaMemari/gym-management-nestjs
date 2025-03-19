import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { SortOrder } from '../../../common/enums/shared.enum';

export class CreateLessonDto {
  @ApiProperty({ example: '' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ example: '<p>HTML content here...</p>', required: false })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiProperty({ example: 1 })
  @IsNotEmpty()
  @IsInt()
  beltId: number;
}

export class UpdateLessonDto extends PartialType(CreateLessonDto) {}

export class QueryLessonDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ type: 'string', example: '', description: '' })
  search?: string;

  @IsOptional()
  @IsEnum(SortOrder, { message: 'sort_order must be either "asc" or "desc"' })
  @ApiPropertyOptional({ example: 'desc', enum: SortOrder })
  sort_order?: SortOrder;
}
