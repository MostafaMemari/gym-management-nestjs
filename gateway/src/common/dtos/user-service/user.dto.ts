import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsEnum, IsNotEmpty, IsOptional, IsPhoneNumber, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { Role } from '../../../common/enums/role.enum';
import { Transform } from 'class-transformer';
import { SortOrder, UserSortBy } from '../../../common/enums/shared.enum';

export class UpdateUserDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  @MinLength(3)
  @IsOptional()
  @Matches(/^09\d{9}$/, {
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

export class QueryUsersDto {
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
  @IsEnum(Role)
  @ApiProperty({
    type: 'string',
    enum: Role,
    nullable: true,
    required: false,
  })
  role?: Role;

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
