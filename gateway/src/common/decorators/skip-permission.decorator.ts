import { SetMetadata } from '@nestjs/common';

export const SKIP_PERMISSION = 'SKIP_PERMISSION';

export const SkipPermission = () => SetMetadata(SKIP_PERMISSION, true);
