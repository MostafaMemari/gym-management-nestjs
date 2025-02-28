import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class PaginationDto {
  @ApiPropertyOptional()
  @IsNumber()
  @IsPositive()
  @IsOptional()
  @Transform(({ value }) => Number(value) || 1)
  page: number = 1;

  @ApiPropertyOptional()
  @IsNumber()
  @IsPositive()
  @IsOptional()
  @Transform(({ value }) => Number(value) || 20)
  take: number = 20;
}

export class SearchDto extends PaginationDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  query: string;
}
