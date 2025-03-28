import { IsDate, IsEnum, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';
import { PaginationDto } from '../shared.dto';
import { Transform } from 'class-transformer';
import { SortOrder, WalletDeductionSortBy } from '../../../common/enums/shared.enum';
import { ApiProperty } from '@nestjs/swagger';

export class QueryWalletDeductionsDto extends PaginationDto {
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
  @Transform(({ value }) => +value)
  @ApiProperty({
    type: 'number',
    nullable: true,
    required: false,
  })
  walletId?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Transform(({ value }) => +value)
  @ApiProperty({
    type: 'number',
    nullable: true,
    required: false,
  })
  minAmount?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Transform(({ value }) => +value)
  @ApiProperty({
    type: 'number',
    nullable: true,
    required: false,
  })
  maxAmount?: number;

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
  @IsString()
  @IsEnum(WalletDeductionSortBy)
  @ApiProperty({
    type: 'string',
    enum: WalletDeductionSortBy,
    nullable: true,
    required: false,
  })
  sortBy?: 'createdAt' | 'deductionAmount' | 'remainingBalance';

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
