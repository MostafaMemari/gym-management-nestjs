import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsInt, IsOptional } from 'class-validator';
import { Express } from 'express';

export class CreateLessonDto {
  @ApiProperty({ example: 'اصول پایه‌ای ضربات پا', description: 'عنوان درس' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({
    example: 'این درس شامل تکنیک‌های پایه‌ای کمربند زرد است.',
    description: 'توضیحات کوتاه درس (متن ساده)',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 2, description: 'شناسه کمربند مربوط به این درس' })
  @IsInt()
  @IsNotEmpty()
  beltId: number; // شناسه کمربند (از سرویس Club)

  @ApiPropertyOptional({
    description: 'محتوای کامل درس به‌صورت HTML (ارسالی از Cheditor)',
    example: '<p>در این درس یاد می‌گیرید که چگونه ضربات پایه‌ای را اجرا کنید.</p>',
  })
  @IsOptional()
  @IsString()
  content_html?: string;

  @ApiPropertyOptional({
    description: 'فایل‌های ویدیویی مربوط به درس',
    type: 'array',
    items: { type: 'string', format: 'binary' },
  })
  @IsOptional()
  videos?: Express.Multer.File[]; // آرایه‌ای از فایل‌های ویدیو

  @ApiPropertyOptional({
    description: 'فایل‌های مستندات مربوط به درس (PDF, DOCX, و ...)',
    type: 'array',
    items: { type: 'string', format: 'binary' },
  })
  @IsOptional()
  documents?: Express.Multer.File[]; // آرایه‌ای از فایل‌های مستندات
}
