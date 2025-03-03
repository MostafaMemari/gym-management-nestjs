import { IsNotEmpty, IsEnum, IsInt, Min, IsIn, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
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

  @IsNotEmpty()
  @IsInt()
  @Min(0)
  @Transform(({ value }) => parseInt(value, 10))
  @ApiProperty({ type: 'integer', required: true })
  min_age: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Transform(({ value }) => parseInt(value, 10))
  @ApiProperty({ type: 'integer', required: false, example: 14 })
  max_age?: number;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @IsIn([3, 4, 6, 9, 12, 24, 36, 48, 60, 72, 84, 96, 108])
  @ApiProperty({ type: 'integer', required: true, example: 6 })
  duration_month: number;
}
