import { Injectable, PipeTransform } from '@nestjs/common';
import { ParseFilePipe, MaxFileSizeValidator, FileTypeValidator } from '@nestjs/common/pipes';

@Injectable()
export class UploadFileValidationPipe implements PipeTransform {
  constructor(private maxSize: number, private fileType: string) {}

  transform(file: Express.Multer.File) {
    if (!file) return file;

    return new ParseFilePipe({
      fileIsRequired: false,
      validators: [new MaxFileSizeValidator({ maxSize: this.maxSize }), new FileTypeValidator({ fileType: this.fileType })],
    }).transform(file);
  }
}
