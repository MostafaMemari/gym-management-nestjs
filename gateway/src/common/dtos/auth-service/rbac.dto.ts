import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsPositive } from 'class-validator';
import { Transform } from 'class-transformer';

enum AllowedRoles {
  STUDENT = 'STUDENT',
  ADMIN_CLUB = 'ADMIN_CLUB',
  COACH = 'COACH',
}

export class AssignRoleDto {
  @ApiProperty()
  @IsNumber()
  @IsPositive()
  @Transform(({ value }) => +value)
  userId: number;

  @ApiProperty({
    enum: AllowedRoles,
  })
  @IsEnum(AllowedRoles)
  role: AllowedRoles;
}
