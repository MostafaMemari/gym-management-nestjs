import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { Services } from '../enums/services.enum';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateBackupDto {
  @IsString()
  @IsNotEmpty()
  @IsEnum(Services)
  @ApiProperty({
    type: 'string',
    enum: Services,
    required: true,
    nullable: false,
  })
  serviceName: Services;
}

export class RestoreBackupDto extends CreateBackupDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  @ApiProperty({
    type: 'string',
    required: true,
    nullable: false,
  })
  key: string;
}
