import { SetMetadata } from '@nestjs/common';

export const SKIP_VERIFY_MOBILE = 'SKIP_VERIFY_MOBILE';

export const SkipVerifyMobile = () => SetMetadata(SKIP_VERIFY_MOBILE, true);
