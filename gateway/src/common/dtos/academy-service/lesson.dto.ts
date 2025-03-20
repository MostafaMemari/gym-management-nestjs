import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsPositive, IsString } from 'class-validator';

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

  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  @Transform(({ value }) => parseInt(value, 10))
  @ApiProperty({ type: 'integer', required: true, example: '' })
  chapterId: number;

  @IsOptional()
  @ApiPropertyOptional({ type: 'string', format: 'binary' })
  cover_image?: Express.Multer.File;

  @IsOptional()
  @ApiPropertyOptional({ type: 'string', format: 'binary' })
  video?: Express.Multer.File;
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
