import { ApiProperty } from '@nestjs/swagger';
import { IsJWT, IsNotEmpty, IsPhoneNumber, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { ConfirmPassword } from '../../decorators/confirmPassword.decorator';

export class SignupDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  @MinLength(3)
  @Matches(/^(?![0-9])[a-zA-Z0-9_-]{3,20}$/, {
    message: 'username is invalid',
  })
  @ApiProperty({
    maxLength: 100,
    minLength: 3,
    type: 'string',
    nullable: false,
    example: 'ali_ahmadi',
  })
  username: string;

  @IsNotEmpty()
  @IsString()
  @IsPhoneNumber('IR')
  @ApiProperty({
    type: 'string',
    nullable: false,
  })
  mobile: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(16)
  @MinLength(8)
  @ApiProperty({
    maxLength: 16,
    minLength: 8,
    type: 'string',
    nullable: false,
  })
  password: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(16)
  @MinLength(8)
  @ApiProperty({
    maxLength: 16,
    minLength: 8,
    type: 'string',
    nullable: false,
  })
  @ConfirmPassword()
  confirmPassword: string;
}

export class SigninDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  identifier: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  password: string;
}

export class SignoutDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  @IsJWT()
  refreshToken: string;
}

export class RefreshTokenDto extends SignoutDto { }

export class ForgetPasswordDto {
  @IsNotEmpty()
  @IsString()
  @IsPhoneNumber('IR')
  @ApiProperty({
    type: 'string',
    nullable: false,
  })
  mobile: string;
}


export class RestPasswordDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    type: "string",
    nullable: false
  })
  mobile: string
  
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    type: "string",
    nullable: false
  })
  otpCode: string

  @IsNotEmpty()
  @IsString()
  @MaxLength(16)
  @MinLength(8)
  @ApiProperty({
    maxLength: 16,
    minLength: 8,
    type: 'string',
    nullable: false,
  })
  newPassword: string;
}