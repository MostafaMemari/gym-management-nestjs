import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsPositive, IsString } from 'class-validator';

import { SortOrder } from '../../../common/enums/shared.enum';
import { ToArray } from 'src/common/decorators/transformers.decorator';

export class CreateCourseDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: '' })
  title: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: '' })
  description: string;

  @IsNotEmpty()
  @ToArray()
  @IsInt({ each: true })
  @ApiProperty({ type: 'array' })
  beltIds: number[];

  @IsOptional()
  @ApiPropertyOptional({ type: 'string', format: 'binary' })
  cover_image?: Express.Multer.File | string;

  @IsOptional()
  @ApiPropertyOptional({ type: 'string', format: 'binary' })
  intro_video: Express.Multer.File | string;
}

export class UpdateCourseDto extends PartialType(CreateCourseDto) {}

export class QueryCourseDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ type: 'string', example: '', description: '' })
  search?: string;

  @IsOptional()
  @IsEnum(SortOrder, { message: 'sort_order must be either "asc" or "desc"' })
  @ApiPropertyOptional({ example: 'desc', enum: SortOrder })
  sort_order?: SortOrder;
}
