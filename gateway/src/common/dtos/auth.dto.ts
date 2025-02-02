import { ApiProperty } from "@nestjs/swagger"
import { IsAlpha, IsEmail, IsNotEmpty, IsPhoneNumber, IsString, MaxLength, MinLength } from "class-validator"
import { ConfirmPassword } from "../decorators/confirmPassword.decorator"

export class SignupDto {
    @IsNotEmpty()
    @IsString()
    @MaxLength(100)
    @MinLength(3)
    @ApiProperty({
        maxLength: 100,
        minLength: 3,
        type: "string",
        nullable: false,
        example: "Ali Ahmadi",
    })
    name: string

    @IsNotEmpty()
    @IsString()
    @IsEmail()
    @ApiProperty({
        type: "string",
        nullable: false,
        example: "ali_ahmadi@gmail.com",
    })
    email: string

    @IsNotEmpty()
    @IsString()
    @IsPhoneNumber('IR')
    @ApiProperty({
        type: "string",
        nullable: false,
    })
    mobile: string

    @IsNotEmpty()
    @IsString()
    @MaxLength(16)
    @MinLength(8)
    @ApiProperty({
        maxLength: 16,
        minLength: 8,
        type: "string",
        nullable: false,
    })
    password: string

    @IsNotEmpty()
    @IsString()
    @MaxLength(16)
    @MinLength(8)
    @ApiProperty({
        maxLength: 16,
        minLength: 8,
        type: "string",
        nullable: false,
    })
    @ConfirmPassword()
    confirmPassword: string
}