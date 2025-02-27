import { Transform, TransformFnParams } from 'class-transformer';
import { BadRequestException } from '@nestjs/common';

export const ToBoolean = () =>
  Transform((params: TransformFnParams) => {
    const { value } = params;

    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'string') {
      const lowerValue = value.toLowerCase();
      if (lowerValue === 'true') return true;
      if (lowerValue === 'false') return false;
    }

    throw new BadRequestException('Invalid boolean value! Only "true" or "false" is allowed');
  });

export function ToArray(): (target: any, key: string) => void {
  return Transform((params: TransformFnParams) => {
    const { value } = params;

    if (Array.isArray(value)) {
      return Array.from(
        new Set(
          value
            .map((item) => (typeof item === 'string' ? item.trim() : item))
            .map((item) => {
              const num = Number(item);
              return isNaN(num) ? null : num;
            })
            .filter((item) => item !== null),
        ),
      );
    }

    if (typeof value === 'string') {
      return Array.from(
        new Set(
          value
            .split(',')
            .map((item) => item.trim())
            .map((item) => {
              const num = Number(item);
              return isNaN(num) ? null : num;
            })
            .filter((item) => item !== null),
        ),
      );
    }

    return [];
  });
}
