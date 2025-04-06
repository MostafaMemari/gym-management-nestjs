import { Controller, Get, HttpStatus, Inject, Param } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags } from '@nestjs/swagger';
import { lastValueFrom, timeout } from 'rxjs';
import { Services } from '../../common/enums/services.enum';
import { ServiceResponse } from '../../common/interfaces/serviceResponse.interface';
import { checkConnection } from '../../common/utils/checkConnection.utils';
import { handleError, handleServiceResponse } from '../../common/utils/handleError.utils';
import { AwsService } from '../../modules/s3AWS/s3AWS.service';
import { BackupPatterns } from '../../common/enums/shared.enum';
import { Roles } from '../../common/decorators/role.decorator';
import { Role } from '../../common/enums/role.enum';
import { AccessRole } from '../../common/decorators/accessRole.decorator';

@Controller('backup')
@ApiTags('backup')
export class BackupController {
  private readonly timeout = 10000;

  constructor(
    @Inject(Services.USER) private readonly userServiceClient: ClientProxy,
    private readonly awsService: AwsService,
  ) {}

  @Get('user-service')
  @Roles(Role.SUPER_ADMIN)
  @AccessRole(Role.SUPER_ADMIN)
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

  @Get('restore-user-service-backup/:key')
  @Roles(Role.SUPER_ADMIN)
  @AccessRole(Role.SUPER_ADMIN)
  async restoreUserServiceBackup(@Param('key') key: string) {
    try {
      const fileBuffer = await this.awsService.getFileBuffer(key);

      const restoreData = {
        file: fileBuffer,
        fileName: key.split('/').at(-1),
      };

      this.userServiceClient.emit(BackupPatterns.RestoreBackup, restoreData);

      return handleServiceResponse({ data: {}, error: false, message: 'Backup will be applied shortly.', status: HttpStatus.OK });
    } catch (error) {
      handleError(error, 'Failed to restore user service backup', Services.USER);
    }
  }
}
