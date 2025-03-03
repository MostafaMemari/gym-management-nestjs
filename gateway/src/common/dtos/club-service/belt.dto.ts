import { IsNotEmpty, IsEnum, IsInt, Min, IsIn, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

import { BeltName } from '../../../common/enums/belt.enum';

export class CreateBeltDto {
  @IsNotEmpty()
  @IsEnum(BeltName)
  @ApiProperty({ example: BeltName.BLUE, enum: BeltName })
  name: BeltName;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => parseInt(value, 10))
  @ApiProperty({ type: 'integer', required: true, example: 4 })
  level: number;

  @IsOptional()
  @IsInt()
  @Transform(({ value }) => (value !== undefined ? parseInt(value, 10) : null))
  @ApiPropertyOptional({ type: 'integer', required: false, example: 10 })
  min_age?: number;

  @IsOptional()
  @IsInt()
  @Transform(({ value }) => (value !== undefined ? parseInt(value, 10) : null))
  @ApiPropertyOptional({ type: 'integer', required: false, example: 50 })
  max_age?: number;

  @IsOptional()
  @IsInt()
  @Transform(({ value }) => (value !== undefined ? parseInt(value, 10) : 0))
  @IsIn([0, 3, 4, 6, 9, 12, 24, 36, 48, 60, 72, 84, 96, 108])
  @ApiPropertyOptional({ type: 'integer', required: false, example: 12 })
  duration_month: number;
}

export class UpdateBeltDto extends PartialType(CreateBeltDto) {}

export class QueryBeltDto {
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
