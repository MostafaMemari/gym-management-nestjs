import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class FilesValidationPipe implements PipeTransform {
  constructor(private readonly rules: Record<string, { types: string[]; maxSize: number }>) {}

  transform(files: { [key: string]: Express.Multer.File[] }) {
    if (!files) return {};

    for (const field in files) {
      if (files[field] && Array.isArray(files[field])) {
        files[field].forEach((file) => {
          const rule = this.rules[field];
          if (!rule) return;

          if (!rule.types.includes(file.mimetype)) {
            throw new BadRequestException(`The file format of "${file.originalname}" is not allowed for the field "${field}".`);
          }

          if (file.size > rule.maxSize) {
            throw new BadRequestException(`The file "${file.originalname}" exceeds the maximum allowed size for the field "${field}".`);
          }
        });
      }
    }
    return files;
  }
}
