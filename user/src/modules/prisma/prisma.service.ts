import { forwardRef, HttpStatus, Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient, Role } from '@prisma/client';
import { CacheService } from '../cache/cache.service';
import { CacheKeys } from '../../common/enums/cache.enum';
import * as path from 'path';
import * as fs from 'fs';
import * as fsPromise from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';
import { RpcException } from '@nestjs/microservices';
import { ResponseUtil } from '../../common/utils/response.utils';
import { ServiceResponse } from '../../common/interfaces/serviceResponse.interface';

const execPromise = promisify(exec);

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(@Inject(forwardRef(() => CacheService)) private readonly cacheService: CacheService) {
    super();
  }

  private readonly logger = new Logger('PrismaService');

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Database connected successfully.');
    this.useMiddleware();
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Disconnected from database.');
  }

  useMiddleware(): void {
    this.$use(async (params, next) => {
      const { action, model } = params;

      if (['create', 'update', 'delete'].includes(action)) {
        //* Clear user cache on create, update, or delete
        for (const key in CacheKeys) await this.cacheService.delByPattern(`${CacheKeys[key]}*`);
      }

      if (model == 'User' && action == 'update') {
        const beforeUser = await this.user.findFirst({ where: { id: params.args.where.id } });
        const wallet = await this.wallet.findFirst({ where: { userId: params.args.where.id } });

        const result = await next(params);

        if (wallet) return result;

        if (beforeUser && result.role == Role.ADMIN_CLUB) {
          await this.wallet.create({ data: { userId: beforeUser.id, lastWithdrawalDate: new Date() } });
        }

        return result;
      }

      return next(params);
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
      const fileName = `backup-user-service-${timestamp}.sql`;
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
