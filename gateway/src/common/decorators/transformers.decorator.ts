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

export function ToArray<T = any>(enumType?: T): (target: any, key: string) => void {
  return Transform(({ value }: TransformFnParams) => {
    if (!value) return [];

    const normalize = (item: any) => {
      if (typeof item === 'string') item = item.trim();

      if (enumType && Object.values(enumType).includes(item)) {
        return item as T;
      }

      const num = Number(item);
      return isNaN(num) ? null : num;
    };

    if (Array.isArray(value)) {
      return Array.from(new Set(value.map(normalize).filter((item) => item !== null)));
    }

    if (typeof value === 'string') {
      return Array.from(
        new Set(
          value
            .split(',')
            .map(normalize)
            .filter((item) => item !== null),
        ),
      );
    }

    return [];
  });
}
