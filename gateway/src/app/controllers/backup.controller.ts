import { BadRequestException, Body, Controller, HttpStatus, Inject, Logger, Post } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
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
import { CreateBackupDto, RestoreBackupDto } from '../../common/dtos/backup.dto';
import { SwaggerConsumes } from 'src/common/enums/swagger-consumes.enum';

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

  private findServiceOrFail(serviceName: string) {
    try {
      const services = this.getServicesForBackup();
      const service = services.find((service) => service.name === serviceName);

      if (!service) throw new BadRequestException('Service not found in backup list');

      return service;
    } catch (error) {
      handleError(error, error.message, BackupController.name);
    }
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

  @Post('create-backup')
  @Roles(Role.SUPER_ADMIN)
  @AccessRole(Role.SUPER_ADMIN)
  @ApiConsumes(SwaggerConsumes.Json, SwaggerConsumes.UrlEncoded)
  async createBackup(@Body() createBackupDto: CreateBackupDto) {
    const service = this.findServiceOrFail(createBackupDto.serviceName);
    try {
      await checkConnection(service.name, service.client);

      const result: ServiceResponse = await lastValueFrom(service.client.send(service.pattern, {}).pipe(timeout(this.timeout)));

      if (result.error) throw result;

      const uploadedBackup = await this.awsService.uploadSingleFile({
        fileMetadata: { file: result.data.file, fileName: result.data.fileName },
        contentType: result.data?.contentType,
        folderName: service.folderName,
        isPublic: false,
      });

      return handleServiceResponse({ ...result, data: { ...uploadedBackup } });
    } catch (error) {
      handleError(error, 'Failed to create backup', service?.name);
    }
  }

  @Post('restore-backup')
  @Roles(Role.SUPER_ADMIN)
  @AccessRole(Role.SUPER_ADMIN)
  @ApiConsumes(SwaggerConsumes.Json, SwaggerConsumes.UrlEncoded)
  async restoreBackup(@Body() { key, serviceName }: RestoreBackupDto) {
    const service = this.findServiceOrFail(serviceName);
    try {
      const fileBuffer = await this.awsService.getFileBuffer(key);

      const restoreData = {
        file: fileBuffer,
        fileName: key.split('/').at(-1),
      };

      service.client.emit(service.pattern, restoreData);

      return handleServiceResponse({ data: {}, error: false, message: 'Backup will be applied shortly.', status: HttpStatus.OK });
    } catch (error) {
      handleError(error, 'Failed to restore backup', service?.name);
    }
  }
}
