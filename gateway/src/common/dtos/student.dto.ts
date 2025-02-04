import { IsNotEmpty, IsOptional, IsString, IsEnum, IsBoolean, IsUUID, IsDate, IsPhoneNumber, IsDateString } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Gender } from "../enums/gender.enum";

export class CreateStudentDto {
  @ApiProperty({
    example: "",
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  full_name: string;

  @ApiProperty({
    example: "",
    enum: Gender,
  })
  @IsNotEmpty()
  @IsEnum(Gender)
  gender: Gender;

  @ApiPropertyOptional({
    example: "",
    default: true,
    type: Boolean,
  })
  @IsBoolean()
  @IsOptional()
  is_active: boolean = true;

  @ApiPropertyOptional({
    example: "",
    type: String,
  })
  @IsOptional()
  @IsString()
  image_url?: string;

  @ApiPropertyOptional({
    example: "",
    type: String,
  })
  @IsOptional()
  @IsString()
  father_name?: string;

  @ApiProperty({
    example: "",
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  national_code: string;

  @ApiProperty({
    example: "",
    type: String,
  })
  @IsNotEmpty()
  @IsPhoneNumber(null)
  phone_number: string;

  @ApiPropertyOptional({
    example: "",
    type: String,
  })
  @IsOptional()
  @IsPhoneNumber(null)
  landline_number?: string;

  @ApiPropertyOptional({
    example: "",
    type: String,
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({
    example: "",
    type: String,
  })
  @IsNotEmpty()
  @IsDateString()
  birth_date: string;

  @ApiPropertyOptional({
    example: "",
    type: String,
  })
  @IsOptional()
  @IsDateString()
  sports_insurance_date?: string;

  @ApiPropertyOptional({
    example: "",
    type: String,
  })
  @IsOptional()
  @IsDateString()
  expire_image_date?: string;

  @ApiProperty({
    example: "",
    type: String,
  })
  @IsNotEmpty()
  @IsUUID()
  coach_id: string;

  @ApiProperty({
    example: "",
    type: String,
  })
  @IsNotEmpty()
  @IsUUID()
  club_id: string;

  @ApiProperty({
    example: "",
    type: String,
  })
  @IsNotEmpty()
  @IsUUID()
  age_category_id: string;
}
