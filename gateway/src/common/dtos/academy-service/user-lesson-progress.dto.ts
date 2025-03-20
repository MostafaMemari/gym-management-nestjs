import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber } from 'class-validator';

export class UserLessonProgressDto {
  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({ example: '1' })
  userId: number;

  @ApiProperty({ example: '5' })
  @IsNotEmpty()
  @IsNumber()
  lessonId: number;

  @ApiProperty({ example: true })
  @IsNotEmpty()
  @IsBoolean()
  is_completed: boolean;
}
