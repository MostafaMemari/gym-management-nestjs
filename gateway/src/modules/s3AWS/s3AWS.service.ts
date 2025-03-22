import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { lookup } from 'mime-types';
import * as path from 'path';

@Injectable()
export class AwsService {
  private client: S3Client;
  private bucketName = this.configService.get('S3_BUCKET_NAME');

  constructor(private readonly configService: ConfigService) {
    const s3_region = this.configService.get('S3_REGION');

    if (!s3_region) {
      throw new Error('S3_REGION not found in environment variables');
    }

    this.client = new S3Client({
      region: s3_region,
      credentials: {
        accessKeyId: this.configService.get('S3_ACCESS_KEY'),
        secretAccessKey: this.configService.get('S3_SECRET_ACCESS_KEY'),
      },
      forcePathStyle: true,
      endpoint: configService.get<string>('S3_ENDPOINT'),
    });
  }

  async uploadSingleFile({
    file,
    folderName = '',
    isPublic = true,
  }: {
    file: Partial<Express.Multer.File>;
    folderName?: string;
    isPublic?: boolean;
  }): Promise<any> {
    const ext = path.extname(file.originalname);
    const contentType = lookup(ext) || 'application/octet-stream';
    const bufferFile = Buffer.from(file.buffer);
    const key = `${folderName}/${Date.now()}${ext}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: bufferFile,
      ContentType: contentType,
      ACL: isPublic ? 'public-read' : 'private',
      ContentLength: bufferFile.length,
    });

    const uploadResult = await this.client.send(command);

    if (uploadResult.$metadata.httpStatusCode !== 200) throw new BadRequestException('Image upload failed');

    return {
      url: (await this.getFileUrl(key)).url,
      key,
      isPublic,
    };
  }

  async getFileUrl(key: string) {
    return { url: `https://node-bucket.storage.c2.liara.space/${key}` };
  }

  async deleteFile(key: string) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const deleteResult = await this.client.send(command);

      return deleteResult;
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }
}
