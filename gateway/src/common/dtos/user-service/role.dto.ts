import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsDate, IsEnum, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { CreatePermissionDto } from './permission.dto';
import { Transform, Type } from 'class-transformer';
import { PaginationDto } from '../shared.dto';
import { RoleSortBy, SortOrder } from '../../../common/enums/shared.enum';

export class CreateRoleDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    type: 'string',
    nullable: false,
    required: true,
  })
  name: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreatePermissionDto)
  @ApiProperty({
    type: CreatePermissionDto,
    required: false,
    nullable: true,
    uniqueItems: true,
    isArray: true,
    examples: [
      { method: 'GET', endpoint: '/users' },
      { method: 'POST', endpoint: '/login' },
    ],
  })
  permissions?: CreatePermissionDto[];
}

export class QueryRolesDto extends PaginationDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @ApiProperty({
    type: 'string',
    nullable: true,
    required: false,
  })
  name?: string;

  @IsBoolean()
  @IsOptional()
  @ApiProperty({
    type: 'boolean',
    nullable: true,
    required: false,
  })
  @Transform(({ value }) => {
    if (typeof value == 'string') return value == 'true';

    return value;
  })
  includePermissions?: boolean;

  @IsBoolean()
  @IsOptional()
  @ApiProperty({
    type: 'boolean',
    nullable: true,
    required: false,
  })
  @Transform(({ value }) => {
    if (typeof value == 'string') return value == 'true';

    return value;
  })
  includeUsers?: boolean;

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
  @IsEnum(RoleSortBy)
  @ApiProperty({
    type: 'string',
    enum: RoleSortBy,
    nullable: true,
    required: false,
  })
  sortBy?: RoleSortBy;

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
