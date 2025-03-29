import { ApiProperty, OmitType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsPositive, IsString, MaxLength, Min, MinLength, Max, IsDate, IsEnum, IsOptional } from 'class-validator';
import { PaginationDto } from './shared.dto';
import { SortOrder, TransactionsSortBy, TransactionStatus } from '../enums/shared.enum';

export class PaymentDto {
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  @ApiProperty({
    type: 'number',
    required: true,
    nullable: false,
    minimum: 1000,
    maximum: 200_000_000,
  })
  @Min(1000)
  @Max(200_000_000)
  @Transform(({ value }) => +value)
  amount: number;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    type: 'string',
    maxLength: 200,
    minLength: 5,
    nullable: false,
    required: true,
  })
  @MaxLength(200)
  @MinLength(5)
  description: string;
}

export class QueryTransactionsDto extends PaginationDto {
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Transform(({ value }) => +value)
  @ApiProperty({
    type: 'number',
    nullable: true,
    required: false,
  })
  userId?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Min(1000)
  @Max(200_000_000)
  @Transform(({ value }) => +value)
  @ApiProperty({
    type: 'number',
    minimum: 1000,
    maximum: 200_000_000,
    nullable: true,
    required: false,
  })
  minAmount?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Min(1000)
  @Max(200_000_000)
  @Transform(({ value }) => +value)
  @ApiProperty({
    type: 'number',
    minimum: 1000,
    maximum: 200_000_000,
    nullable: true,
    required: false,
  })
  maxAmount?: number;

  @IsOptional()
  @IsString()
  @ApiProperty({
    type: 'string',
    nullable: true,
    required: false,
  })
  authority?: string;

  @IsOptional()
  @IsDate()
  @Transform(({ value }) => new Date(value))
  @ApiProperty({ type: 'string', format: 'date-time', nullable: true, required: false })
  startDate?: Date;

  @IsOptional()
  @IsDate()
  @Transform(({ value }) => new Date(value))
  @ApiProperty({ type: 'string', format: 'date-time', nullable: true, required: false })
  endDate?: Date;

  @IsOptional()
  @IsEnum(TransactionStatus)
  @ApiProperty({
    type: 'string',
    enum: TransactionStatus,
    nullable: true,
    required: false,
  })
  status?: TransactionStatus;

  @IsOptional()
  @IsString()
  @IsEnum(TransactionsSortBy)
  @ApiProperty({
    type: 'string',
    enum: TransactionsSortBy,
    nullable: true,
    required: false,
  })
  sortBy?: 'createdAt' | 'updatedAt' | 'amount';

  @IsOptional()
  @IsEnum(SortOrder)
  @ApiProperty({
    type: 'string',
    enum: SortOrder,
    nullable: true,
    required: false,
  })
  sortDirection?: 'asc' | 'desc';
}

export class QueryMyTransactionsDto extends OmitType(QueryTransactionsDto, ['userId']) {}
