import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

import { SortOrder } from '../../../common/enums/shared.enum';

export class CreateLessonFileDto {
  @ApiProperty({ example: 'video', enum: ['video', 'document', 'image'] })
  @IsEnum(['video', 'document', 'image'])
  fileType: 'video' | 'document' | 'image';

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  orderNumber?: number;
}

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
