import { Transform, TransformFnParams } from 'class-transformer';

export function ToBoolean(): (target: any, key: string) => void {
  return Transform((params: TransformFnParams) => {
    const { value } = params;
    if (typeof value === 'boolean') {
      return value;
    }
    if (value?.toString()?.toLowerCase() === 'false') {
      return false;
    }
    if (value?.toString()?.toLowerCase() === 'true') {
      return true;
    }
    return undefined;
  });
}

export function ToArray(): (target: any, key: string) => void {
  return Transform((params: TransformFnParams) => {
    const { value } = params;

    if (Array.isArray(value)) {
      return value
        .map((item) => (typeof item === 'string' ? item.trim() : item))
        .map((item) => {
          const num = Number(item);
          return isNaN(num) ? null : num;
        })
        .filter((item) => item !== null);
    }

    if (typeof value === 'string') {
      return value
        .split(',')
        .map((item) => item.trim())
        .map((item) => {
          const num = Number(item);
          return isNaN(num) ? null : num;
        })
        .filter((item) => item !== null);
    }

    return [];
  });
}
