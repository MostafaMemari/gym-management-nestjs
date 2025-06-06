import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsDate, IsEnum, IsNotEmpty, IsOptional, IsPhoneNumber, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { SortOrder, UserSortBy } from '../../../common/enums/shared.enum';
import { PaginationDto } from '../shared.dto';

export class UpdateUserDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  @MinLength(3)
  @IsOptional()
  @Matches(/^(?![0-9])[a-zA-Z0-9_-]{3,20}$/, {
    message: 'username is invalid',
  })
  @ApiProperty({
    maxLength: 100,
    minLength: 3,
    type: 'string',
    nullable: true,
    required: false,
    example: 'ali_ahmadi',
  })
  username?: string;

  @IsNotEmpty()
  @IsOptional()
  @IsString()
  @IsPhoneNumber('IR')
  @ApiProperty({
    type: 'string',
    nullable: true,
    required: false,
  })
  mobile?: string;
}

export class QueryUsersDto extends PaginationDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @ApiProperty({
    type: 'string',
    required: false,
    nullable: true,
  })
  username?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @ApiProperty({
    type: 'string',
    required: false,
    nullable: true,
  })
  mobile?: string;

  @IsOptional()
  @IsDate()
  @Transform(({ value }) => new Date(value))
  @ApiProperty({ type: 'string', format: 'date-time', nullable: true, required: false })
  lastPasswordChange?: Date;

  @IsBoolean()
  @IsOptional()
  @IsNotEmpty()
  @Transform(({ value }) => {
    if (typeof value == 'string') return value == 'true';
    return value;
  })
  @ApiProperty({
    type: 'boolean',
    required: false,
    nullable: true,
  })
  includeRoles?: boolean;

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
  @IsEnum(UserSortBy)
  @ApiProperty({
    type: 'string',
    enum: UserSortBy,
    nullable: true,
    required: false,
  })
  sortBy?: UserSortBy;

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
