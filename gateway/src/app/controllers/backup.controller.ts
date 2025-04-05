import { Controller, Get, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags } from '@nestjs/swagger';
import { lastValueFrom, timeout } from 'rxjs';
import { Services } from '../../common/enums/services.enum';
import { ServiceResponse } from '../../common/interfaces/serviceResponse.interface';
import { checkConnection } from '../../common/utils/checkConnection.utils';
import { handleError, handleServiceResponse } from '../../common/utils/handleError.utils';
import { AwsService } from '../../modules/s3AWS/s3AWS.service';
import { BackupPatterns } from '../../common/enums/shared.enum';

@Controller('backup')
@ApiTags('backup')
export class BackupController {
  private readonly timeout = 5000;

  constructor(
    @Inject(Services.USER) private readonly userServiceClient: ClientProxy,
    private readonly awsService: AwsService,
  ) {}

  @Get('user-service')
  async createUserServiceBackup() {
    try {
      await checkConnection(Services.USER, this.userServiceClient);

      const result: ServiceResponse = await lastValueFrom(this.userServiceClient.send(BackupPatterns.CreateBackup, {}).pipe(timeout(this.timeout)));

      if (result.error) throw result;

      const uploadedBackup = await this.awsService.uploadSingleFile({
        fileMetadata: { file: result.data.file, fileName: result.data.fileName },
        contentType: result.data?.contentType,
        folderName: `user-service-backup`,
        isPublic: false,
      });

      return handleServiceResponse({ ...result, data: { ...uploadedBackup } });
    } catch (error) {
      handleError(error, 'Failed to create backup for user service', Services.USER);
    }
  }
}
