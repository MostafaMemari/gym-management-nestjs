import { IsNotEmpty, IsEnum, IsDateString } from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';

import { AgeCategoryName } from 'src/common/enums/age-category.enum';

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

export class QueryAgeCategoryDto {
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
