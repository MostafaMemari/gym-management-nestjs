import { Controller } from '@nestjs/common';
import { BackupService } from './backup.service';
import { MessagePattern, EventPattern, Payload } from '@nestjs/microservices';
import { BackupPatterns } from '../../common/enums/backup.events';

@Controller()
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @MessagePattern(BackupPatterns.CreateBackup)
  createBackup() {
    return this.backupService.createBackup();
  }

  @EventPattern(BackupPatterns.RestoreBackup)
  async restoreBackup(@Payload() data: { file: Buffer; fileName: string }) {
    await this.backupService.restoreBackup(data);
  }
}
