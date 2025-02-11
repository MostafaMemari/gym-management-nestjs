import { HttpStatus, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import * as sharp from 'sharp';
import { lookup } from 'mime-types';
import * as path from 'path';
import { Readable } from 'stream';
import { ResponseUtil } from '../../common/utils/response';
import { StudentMessages } from '../../common/enums/student.messages';

@Injectable()
export class AwsService {
  private client: S3Client;
  private bucketName = this.configService.get('S3_BUCKET_NAME');

  constructor(private readonly configService: ConfigService) {
    const s3_region = this.configService.get('S3_REGION');

    if (!s3_region) {
      console.warn('S3_REGION not found in environment variables');
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
    file: Express.Multer.File;
    folderName?: string;
    isPublic?: boolean;
  }): Promise<any> {
    try {
      const ext = path.extname(file.originalname);
      const contentType = lookup(ext) || 'application/octet-stream';

      const bufferFile = Buffer.from(file.buffer);
      const processedImage = await sharp(bufferFile).resize({ width: 150 }).jpeg({ quality: 80 }).toBuffer();
      const key = `${folderName}/${Date.now()}${ext}`;

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: processedImage,
        ContentType: contentType,
        ACL: isPublic ? 'public-read' : 'private',
        ContentLength: processedImage.length,
      });

      const uploadResult = await this.client.send(command);

      if (uploadResult.$metadata.httpStatusCode !== 201) ResponseUtil.error(StudentMessages.FailedToUploadImage, HttpStatus.BAD_REQUEST);

      return {
        url: isPublic ? (await this.getFileUrl(key)).url : (await this.getPresignedSignedUrl(key)).url,
        key,
        isPublic,
      };
    } catch (error) {
      ResponseUtil.error(error.message, error.status);
    }
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

      console.info(`File deleted from S3: ${key}`);

      return deleteResult;
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(error);
    }
  }

  /**
   * @description Get a signed URL for a file in S3, its not being used in the project, just added for reference
   */
  async getPresignedSignedUrl(key: string) {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const url = await getSignedUrl(this.client, command, {
        expiresIn: 60 * 60 * 24, // 24 hours
      });

      return { url };
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(error);
    }
  }

  async uploadMultiplePublicFiles(files: Express.Multer.File[]) {
    try {
      const uploadPromises = files.map(async (file) => {
        const key = `${uuidv4()}`;

        const command = new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
          ACL: 'public-read',
        });

        const uploadResult = await this.client.send(command);

        console.debug(`File uploaded to S3: ${file.originalname} - ${uploadResult.ETag}`);

        return {
          url: (await this.getFileUrl(key)).url,
        };
      });

      return Promise.all(uploadPromises);
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(error);
    }
  }
}
