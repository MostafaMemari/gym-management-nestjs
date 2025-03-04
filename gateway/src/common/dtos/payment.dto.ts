import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsPositive, IsString, MaxLength, Min, MinLength } from 'class-validator';

export class PaymentDto {
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  @ApiProperty({
    type: 'number',
    required: true,
    nullable: false,
    minimum: 1000,
  })
  @Min(1000)
  @Transform(({ value }) => +value)
  amount: number;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    type: 'string',
    maxLength: 200,
    minLength: 5,
    nullable: false,
    required: true,
  })
  @MaxLength(200)
  @MinLength(5)
  description: string;
}
