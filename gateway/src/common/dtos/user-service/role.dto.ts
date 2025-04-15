import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { CreatePermissionDto } from './permission.dto';
import { Type } from 'class-transformer';

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
