import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsString } from 'class-validator';

enum ALLOW_HTTP_METHODS {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
}

export class CreatePermissionDto {
  @ApiProperty({
    type: 'string',
    required: true,
    enum: ALLOW_HTTP_METHODS,
    nullable: false,
  })
  @IsEnum(ALLOW_HTTP_METHODS)
  method: ALLOW_HTTP_METHODS;

  @IsString()
  @Transform(({ value }) => {
    if (typeof value === 'string' && !value.startsWith('/')) {
      return `/${value}`;
    }
    return value;
  })
  @ApiProperty({
    type: 'string',
    required: true,
    nullable: false,
  })
  endpoint: string;
}
