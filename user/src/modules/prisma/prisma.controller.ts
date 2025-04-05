import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { PrismaService } from './prisma.service';
import { PrismaPatterns } from '../../common/enums/prisma.events';

@Controller()
export class PrismaController {
  constructor(private readonly prismaService: PrismaService) {}

  @MessagePattern(PrismaPatterns.CreateBackup)
  createBackup() {
    return this.prismaService.createBackup();
  }
}
