import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNumber, IsOptional, IsPositive, Max } from 'class-validator';

export class PaginationDto {
  @ApiPropertyOptional({
    type: 'number',
    required: false,
    nullable: true,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  @Transform(({ value }) => Number(value) || 1)
  page: number = 1;

  @ApiPropertyOptional({
    type: 'number',
    maximum: 100,
    required: false,
    nullable: true,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  @Max(100)
  @Transform(({ value }) => Number(value) || 20)
  take: number = 20;
}
