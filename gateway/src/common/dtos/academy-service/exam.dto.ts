import { IsNotEmpty, IsString, IsNumber, IsDateString } from 'class-validator';

export class CreateExamDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsNumber()
  beltId: number;

  @IsNotEmpty()
  @IsDateString()
  examDate: string;
}
