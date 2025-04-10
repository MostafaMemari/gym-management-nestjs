import { IsBoolean, IsDate, IsEnum, IsNumber, IsOptional, IsPositive, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import { PaginationDto } from '../shared.dto';
import { Transform } from 'class-transformer';
import { SortOrder, WalletCreditSortBy, WalletDeductionSortBy, WalletSortBy, WalletStatus } from '../../../common/enums/shared.enum';
import { ApiProperty, OmitType } from '@nestjs/swagger';

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
  sortBy?: WalletDeductionSortBy;

  @IsOptional()
  @IsEnum(SortOrder)
  @ApiProperty({
    type: 'string',
    enum: SortOrder,
    nullable: true,
    required: false,
  })
  sortDirection?: SortOrder;
}

export class ManualCreditDto {
  @IsNumber()
  @IsPositive()
  @Min(1000)
  @Max(200_000_000)
  @Transform(({ value }) => +value)
  @ApiProperty({
    type: 'number',
    minimum: 1000,
    maximum: 200_000_000,
  })
  amount: number;

  @IsString()
  @MaxLength(100)
  @MinLength(4)
  @ApiProperty({
    type: 'string',
    minimum: 4,
    maximum: 100,
  })
  reason: string;
}

export class QueryManualCreditsDto extends OmitType(QueryWalletDeductionsDto, ['sortBy']) {
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Transform(({ value }) => +value)
  @ApiProperty({
    type: 'number',
    nullable: true,
    required: false,
  })
  creditedBy?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @ApiProperty({
    type: 'string',
    required: false,
    nullable: true,
  })
  reason?: string;

  @IsOptional()
  @IsString()
  @IsEnum(WalletCreditSortBy)
  @ApiProperty({
    type: 'string',
    enum: WalletCreditSortBy,
    nullable: true,
    required: false,
  })
  sortBy?: WalletCreditSortBy;
}

export class QueryWalletsDto extends PaginationDto {
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
  @Max(2_000_000_000)
  @Transform(({ value }) => +value)
  @ApiProperty({
    type: 'number',
    maximum: 2_000_000_000,
    nullable: true,
    required: false,
  })
  maxBalance?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Max(2_000_000_000)
  @Transform(({ value }) => +value)
  @ApiProperty({
    type: 'number',
    maximum: 2_000_000_000,
    nullable: true,
    required: false,
  })
  minBalance?: number;

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
  @IsBoolean()
  @Transform(({ value }) => {
    if (typeof value == 'boolean') return value;
    return value == 'true';
  })
  @ApiProperty({
    type: 'boolean',
    nullable: true,
    required: false,
  })
  isBlocked?: boolean;

  @IsOptional()
  @IsString()
  @IsEnum(WalletStatus)
  @ApiProperty({
    type: 'string',
    enum: WalletStatus,
    nullable: true,
    required: false,
  })
  status?: WalletStatus;

  @IsOptional()
  @IsDate()
  @Transform(({ value }) => new Date(value))
  @ApiProperty({ type: 'string', format: 'date-time', nullable: true, required: false })
  lastWithdrawalDate?: Date;

  @IsOptional()
  @IsString()
  @IsEnum(WalletSortBy)
  @ApiProperty({
    type: 'string',
    enum: WalletSortBy,
    nullable: true,
    required: false,
  })
  sortBy?: WalletSortBy;

  @IsOptional()
  @IsString()
  @IsEnum(SortOrder)
  @ApiProperty({
    type: 'string',
    enum: SortOrder,
    nullable: true,
    required: false,
  })
  sortDirection?: SortOrder;
}
