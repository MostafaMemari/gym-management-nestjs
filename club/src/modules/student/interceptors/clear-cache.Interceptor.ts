import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';

import { CacheService } from '../../../modules/cache/cache.service';
import { CacheKeys } from 'src/common/enums/cache';

@Injectable()
export class ClearCacheInterceptor implements NestInterceptor {
  constructor(private cacheService: CacheService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      tap(async (response) => {
        if (response && !response.error) {
          const request = context.switchToRpc().getData();

          console.log(response);
          console.log(request);
          const cacheKeys: string[] = [];

          if (request.user) {
            // cacheKeys.push(`${CacheKeys.STUDENTS}`.replace(':userId', ownerId.toString()) + '*');
          }
          if (request.gymId) {
            cacheKeys.push(`gym:${request.gymId}`);
          }
          if (response.data?.coach_id) {
            cacheKeys.push(`coach:${response.data.coach_id}`);
          }

          for (const key of cacheKeys) {
            await this.cacheService.del(key);
          }
        }
      }),
    );
  }
}
