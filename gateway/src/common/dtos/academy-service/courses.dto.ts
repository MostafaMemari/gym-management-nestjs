import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsPositive, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

import { SortOrder } from '../../../common/enums/shared.enum';

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
  @IsInt()
  @IsPositive()
  @Transform(({ value }) => parseInt(value, 10))
  @ApiProperty({ type: 'integer', required: true, example: '' })
  beltId: number;

  @IsOptional()
  @ApiPropertyOptional({ type: 'string', format: 'binary' })
  cover_image?: Express.Multer.File;

  @IsOptional()
  @ApiPropertyOptional({ type: 'string', format: 'binary' })
  intro_video: string;
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
