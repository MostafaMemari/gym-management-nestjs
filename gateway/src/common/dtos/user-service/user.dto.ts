import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsPhoneNumber, IsString, Matches, MaxLength, MinLength } from 'class-validator';

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
