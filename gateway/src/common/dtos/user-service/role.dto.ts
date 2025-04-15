import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsDate, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { PermissionSortBy, RoleSortBy, SortOrder } from '../../../common/enums/shared.enum';
import { PaginationDto } from '../shared.dto';

export class CreateRoleDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    type: 'string',
    nullable: false,
    required: true,
  })
  name: string;
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

export class QueryPermissionDto extends PaginationDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @ApiProperty({
    type: 'string',
    nullable: true,
    required: false,
  })
  method?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @ApiProperty({
    type: 'string',
    nullable: true,
    required: false,
  })
  endpoint?: string;

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
  @IsEnum(PermissionSortBy)
  @ApiProperty({
    type: 'string',
    enum: PermissionSortBy,
    nullable: true,
    required: false,
  })
  sortBy?: PermissionSortBy;

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

export class AssignPermissionDto {
  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
  @Transform(({ value }) => +value)
  @ApiProperty({
    type: 'number',
    nullable: false,
    required: true,
  })
  roleId: number;

  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
  @Transform(({ value }) => +value)
  @ApiProperty({
    type: 'number',
    nullable: false,
    required: true,
  })
  permissionId: number;
}

export class AssignRoleDto {
  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
  @Transform(({ value }) => +value)
  @ApiProperty({
    type: 'number',
    nullable: false,
    required: true,
  })
  roleId: number;

  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
  @Transform(({ value }) => +value)
  @ApiProperty({
    type: 'number',
    nullable: false,
    required: true,
  })
  userId: number;
}

export class UpdateRoleDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @ApiProperty({
    type: 'string',
    nullable: true,
    required: false,
  })
  name: string;
}
