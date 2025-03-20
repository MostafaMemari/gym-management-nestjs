import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { ParseFilePipe, MaxFileSizeValidator, FileTypeValidator } from '@nestjs/common/pipes';

@Injectable()
export class FileValidationPipe implements PipeTransform {
  constructor(
    private readonly maxSize: number,
    private readonly allowedTypes: string[],
  ) {}

  transform(file: Express.Multer.File) {
    if (!file) return file;

    return new ParseFilePipe({
      fileIsRequired: false,
      validators: [new MaxFileSizeValidator({ maxSize: this.maxSize }), new FileTypeValidator({ fileType: this.allowedTypes.join('|') })],
      exceptionFactory: (errors) => {
        const errorMessages = Array.isArray(errors) ? errors.map((err) => err.message).join(', ') : 'Invalid file upload';
        throw new BadRequestException(errorMessages);
      },
    }).transform(file);
  }
}
