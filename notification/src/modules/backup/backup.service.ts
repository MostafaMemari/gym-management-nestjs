import { HttpStatus, Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import * as path from 'path';
import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import { exec } from 'child_process';
import { ServiceResponse } from '../../common/interfaces/serviceResponse.interface';
import { ResponseUtil } from '../../common/utils/response.utils';
import { promisify } from 'util';

const execPromise = promisify(exec);

//TODO: Test backup methods in this class

@Injectable()
export class BackupService {
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
      const fileName = `backup-notification-service-${timestamp}.json`;
      filePath = `${process.cwd()}/asserts/created-backups/${fileName}`;

      fs.mkdirSync(path.dirname(filePath), { recursive: true });

      const command = `mongodump --host ${host} --port ${port} --username ${user} --password ${password} --db ${dbName} --out ${filePath}`;

      await execPromise(command);

      const data = {
        file: fs.readFileSync(filePath),
        fileName,
        contentType: `application/json`,
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

      await fsPromises.writeFile(filePath, fileBuffer);

      const command = `mongorestore --host ${host} --port ${port} --username ${user} --password ${password} --db ${dbName} --drop ${filePath}`;

      await execPromise(command);

      fs.unlinkSync(filePath);

      return ResponseUtil.success({}, 'Backup restored successfully', HttpStatus.OK);
    } catch (error) {
      fs.rmSync(filePath, { force: true });
      throw new RpcException(error);
    }
  }
}
