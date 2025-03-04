import { ApiProperty, OmitType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { ArrayUnique, IsArray, IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class CreateNotificationDto {
  @ApiProperty({
    type: 'string',
    nullable: false,
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => value?.trim())
  message: string;

  @ApiProperty({
    enum: ['SMS', 'EMAIL', 'PUSH'],
    type: 'string',
    nullable: false,
    required: true,
  })
  @IsEnum(['SMS', 'EMAIL', 'PUSH'])
  @IsNotEmpty()
  @IsString()
  type: 'SMS' | 'EMAIL' | 'PUSH';

  @ApiProperty({
    isArray: true,
    type: 'array',
    uniqueItems: true,
    items: { type: 'number', nullable: false },
  })
  @Transform(({ value }) => {
    try {
      const uniqueItems = new Set();
      const parsedValue = JSON.parse(value);
      if (Array.isArray(parsedValue)) {
        parsedValue
          .flat(Infinity)
          .map((item) => (item == null ? item : +item))
          .filter((item) => typeof item == 'number')
          .forEach((item) => uniqueItems.add(item));
        value = [...uniqueItems];
      }

      if (typeof parsedValue == 'string' || typeof value == 'string') value = [+value];

      return value;
    } catch (error) {
      return value;
    }
  })
  @IsArray()
  @ArrayUnique()
  @IsNotEmpty()
  recipients: number[];
}

export class UpdateNotificationDto extends OmitType(CreateNotificationDto, ['type'] as const) {}