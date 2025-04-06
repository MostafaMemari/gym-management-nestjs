import { Controller, Get, HttpStatus, Inject, Logger, Param } from '@nestjs/common';
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
import { Cron, CronExpression } from '@nestjs/schedule';

@Controller('backup')
@ApiTags('backup')
export class BackupController {
  private readonly timeout = 10000;
  private readonly logger = new Logger(BackupController.name);

  constructor(
    @Inject(Services.USER) private readonly userServiceClient: ClientProxy,
    @Inject(Services.PAYMENT) private readonly paymentServiceClient: ClientProxy,
    private readonly awsService: AwsService,
  ) {}

  private getServicesForBackup() {
    const SERVICES_TO_BACKUP = [
      {
        name: Services.USER,
        client: this.userServiceClient,
        pattern: BackupPatterns.CreateBackup,
        folderName: `user-service-backups`,
      },
      {
        name: Services.PAYMENT,
        client: this.paymentServiceClient,
        pattern: BackupPatterns.CreateBackup,
        folderName: `payment-service-backups`,
      },
    ];

    return SERVICES_TO_BACKUP;
  }

  @Cron(CronExpression.EVERY_HOUR)
  private async handleAllServiceBackups() {
    this.logger.log('Starting backup cron job for all services...');

    try {
      const services = this.getServicesForBackup();

      for (const { client, folderName, name, pattern } of services) {
        this.logger.log(`Starting backup for service: ${name}`);

        try {
          await checkConnection(name, client);
          this.logger.log(`Connection to ${name} verified.`);

          const result: ServiceResponse = await lastValueFrom(client.send(pattern, {}).pipe(timeout(this.timeout)));

          if (result.error) {
            this.logger.error(`Backup failed for ${name}: ${JSON.stringify(result.error)}`);
            continue;
          }

          const uploadedBackup = await this.awsService.uploadSingleFile({
            fileMetadata: { file: result.data.file, fileName: result.data.fileName },
            contentType: result.data?.contentType,
            folderName,
            isPublic: false,
          });

          this.logger.log(`Backup uploaded for ${name}: key=${uploadedBackup.key}`);
        } catch (error) {
          this.logger.error(`Error during backup for service ${name}: ${error?.message}`, error.stack);
          continue;
        }
      }

      this.logger.log('Finished backup cron job for all services.');
    } catch (error) {
      this.logger.error(`Critical error in backup cron job: ${error?.message}`, error.stack);
    }
  }

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
