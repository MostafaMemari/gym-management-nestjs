import { HttpStatus, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CacheService } from '../cache/cache.service';
import { CachePatterns } from '../../common/enums/cache.enum';
import { RpcException } from '@nestjs/microservices';
import * as path from 'path';
import * as fs from 'fs';
import * as fsPromise from 'fs/promises';
import { ServiceResponse } from '../../common/interfaces/serviceResponse.interface';
import { ResponseUtil } from '../../common/utils/response.utils';
import { promisify } from 'util';
import { exec } from 'child_process';

const execPromise = promisify(exec);

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private logger = new Logger(PrismaService.name);

  constructor(private readonly cacheService: CacheService) {
    super();
  }

  async onModuleInit() {
    await this.$connect();
    this.useMiddleware();
    this.logger.log('Connected to database.');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Disconnected from database.');
  }

  useMiddleware() {
    this.$use(async (params, next) => {
      if (['create', 'update', 'delete'].includes(params.action)) {
        for (const key in CachePatterns) await this.cacheService.delByPattern(CachePatterns[key]);
      }

      return await next(params);
    });
  }

  private parseDbUrl(url: string) {
    const parsedUrl = new URL(url);

    return {
      user: parsedUrl.username,
      password: parsedUrl.password,
      host: parsedUrl.hostname,
      port: parsedUrl.port,
      dbName: parsedUrl.pathname.slice(1),
    };
  }

  async createBackup(): Promise<ServiceResponse> {
    let filePath: null | string = null;
    try {
      const { dbName, host, password, port, user } = this.parseDbUrl(process.env.DATABASE_URL);

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `backup-payment-service-${timestamp}.sql`;
      filePath = `${process.cwd()}/asserts/created-backups/${fileName}`;

      fs.mkdirSync(path.dirname(filePath), { recursive: true });

      const command = `PGPASSWORD=${password} pg_dump -U ${user} -h ${host} -p ${port} -d ${dbName} -F c -f ${filePath}`;

      await execPromise(command);

      const data = {
        file: fs.readFileSync(filePath),
        fileName,
        contentType: `application/sql`,
      };

      fs.unlinkSync(filePath);

      return ResponseUtil.success(data, 'Backup created successfully', HttpStatus.OK);
    } catch (error) {
      filePath || fs.rmSync(filePath, { force: true });
      throw new RpcException(error);
    }
  }

  async restoreBackup({ file, fileName }: { file: Buffer; fileName: string }): Promise<ServiceResponse> {
    const filePath = `${process.cwd()}/asserts/restored-backups/${fileName}`;

    try {
      const { dbName, host, password, port, user } = this.parseDbUrl(process.env.DATABASE_URL);

      fs.mkdirSync(path.dirname(filePath), { recursive: true });

      const fileBuffer = Buffer.from(file);

      await fsPromise.writeFile(filePath, fileBuffer);

      const command = `PGPASSWORD=${password} pg_restore --clean -h ${host} -p ${port} -U ${user} -d ${dbName} ${filePath}`;

      await execPromise(command);

      fs.unlinkSync(filePath);

      return ResponseUtil.success({}, 'Backup restored successfully', HttpStatus.OK);
    } catch (error) {
      fs.rmSync(filePath, { force: true });
      throw new RpcException(error);
    }
  }
}
