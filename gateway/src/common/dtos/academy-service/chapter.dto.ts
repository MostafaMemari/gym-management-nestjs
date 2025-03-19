import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsPositive, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

import { SortOrder } from '../../../common/enums/shared.enum';

export class CreateChaptersDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: '' })
  title: string;

  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  @Transform(({ value }) => parseInt(value, 10))
  @ApiProperty({ type: 'integer', required: true, example: '' })
  courseId: number;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: '' })
  description?: string;
}

export class UpdateChaptersDto extends PartialType(CreateChaptersDto) {}

export class QueryChaptersDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ type: 'string', example: '', description: '' })
  search?: string;

  @IsOptional()
  @IsEnum(SortOrder, { message: 'sort_order must be either "asc" or "desc"' })
  @ApiPropertyOptional({ example: 'desc', enum: SortOrder })
  sort_order?: SortOrder;
}
