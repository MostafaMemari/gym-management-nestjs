import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { ArrayUnique, IsArray, IsBoolean, IsDate, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from './shared.dto';
import { transformNumberArray } from '../utils/functions.utils';
import { NotificationSortBy, NotificationType, SortOrder } from '../enums/shared.enum';

export class CreateNotificationDto {
  @ApiProperty({
    type: 'string',
    nullable: false,
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => value?.trim())
  message: string;

  @ApiProperty({
    enum: ['PUSH', 'SMS', 'EMAIL'],
    type: 'string',
    nullable: false,
    required: true,
  })
  @IsEnum(['PUSH', 'SMS', 'EMAIL'])
  @IsNotEmpty()
  @IsString()
  type: 'PUSH' | 'SMS' | 'EMAIL';

  @ApiProperty({
    isArray: true,
    type: 'array',
    uniqueItems: true,
    items: { type: 'number', nullable: false },
  })
  @Transform(({ value }) => transformNumberArray(value))
  @IsArray()
  @ArrayUnique()
  @IsNotEmpty()
  recipients: number[];
}

export class UpdateNotificationDto extends PartialType(OmitType(CreateNotificationDto, ['type'] as const)) {}

export class QueryNotificationDto extends PaginationDto {
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsNotEmpty()
  @ApiProperty({
    isArray: true,
    type: 'array',
    uniqueItems: true,
    required: false,
    nullable: true,
    items: { type: 'number', nullable: false },
  })
  @Transform(({ value }) => transformNumberArray(value))
  recipients?: number[];

  @IsOptional()
  @IsString()
  @ApiProperty({
    type: 'string',
    required: false,
    nullable: true,
  })
  message?: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsNotEmpty()
  @ApiProperty({
    isArray: true,
    type: 'array',
    uniqueItems: true,
    required: false,
    nullable: true,
    items: { type: 'number', nullable: false },
  })
  @Transform(({ value }) => transformNumberArray(value))
  readBy?: number[];

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value == 'string') return value == 'true';
    return value;
  })
  @IsBoolean()
  @ApiProperty({
    type: 'boolean',
    required: false,
    nullable: true,
  })
  isEdited?: boolean;

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
  @IsEnum(NotificationType)
  @ApiProperty({
    type: 'string',
    enum: NotificationType,
    nullable: true,
    required: false,
  })
  type?: NotificationType;

  @IsOptional()
  @IsString()
  @IsEnum(NotificationSortBy)
  @ApiProperty({
    type: 'string',
    enum: NotificationSortBy,
    nullable: true,
    required: false,
  })
  sortBy?: NotificationSortBy;

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

export class QueryUserNotificationDto extends OmitType(QueryNotificationDto, ['recipients', 'readBy', 'type']) {}
