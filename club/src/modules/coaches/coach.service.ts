import { ConflictException, HttpStatus, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { lastValueFrom, timeout } from 'rxjs';
import { Repository } from 'typeorm';

import { PageDto, PageMetaDto } from '../../common/dtos/pagination.dto';
import { EntityName } from '../../common/enums/entity.enum';
import { UserPatterns } from '../../common/enums/patterns.events';
import { Services } from '../../common/enums/services.enum';
import { ServiceResponse } from '../../common/interfaces/serviceResponse.interface';
import { ResponseUtil } from '../../common/utils/response';
import { CacheService } from '../cache/cache.service';
import { CacheKeys, CachePatterns } from '../cache/enums/cache.enum';
import { AwsService } from '../s3AWS/s3AWS.service';
import { CoachEntity } from './entities/coach.entity';
import { CoachMessages } from './enums/coach.message';
import { ICoachQuery, ICreateCoach, IUpdateCoach } from './interfaces/coach.interface';

@Injectable()
export class CoachService {
  private readonly timeout: number = 4500;

  constructor(
    @Inject(Services.USER) private readonly userServiceClientProxy: ClientProxy,
    @InjectRepository(CoachEntity) private coachRepository: Repository<CoachEntity>,
    private readonly awsService: AwsService,
    private readonly cacheService: CacheService,
  ) {}

  async checkUserServiceConnection(): Promise<ServiceResponse | void> {
    try {
      await lastValueFrom(this.userServiceClientProxy.send(UserPatterns.CheckConnection, {}).pipe(timeout(this.timeout)));
    } catch (error) {
      throw new RpcException({ message: 'User service is not connected', status: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }

  async create(createCoachDto: ICreateCoach) {
    const queryRunner = this.coachRepository.manager.connection.createQueryRunner();
    await queryRunner.startTransaction();
    let userId = null;
    let imageKey = null;

    try {
      await this.findCoachByNationalCode(createCoachDto.national_code, { duplicateError: true });

      imageKey = await this.uploadCoachImage(createCoachDto.image);

      // userId = await this.createUser();
      //! TODO: Remove fake userId method
      userId = Math.floor(10000 + Math.random() * 900000);

      const coach = this.coachRepository.create({
        ...createCoachDto,
        image_url: imageKey,
        user_id: userId,
      });

      await queryRunner.manager.save(coach);
      await queryRunner.commitTransaction();
      this.clearUsersCache();

      return ResponseUtil.success({ ...coach, user_id: userId }, CoachMessages.CreatedCoach);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await this.removeUserById(userId);
      await this.removeCoachImage(imageKey);
      ResponseUtil.error(error?.message || CoachMessages.FailedToCreateCoach, error?.status || HttpStatus.INTERNAL_SERVER_ERROR);
    } finally {
      await queryRunner.release();
    }
  }
  async updateById(coachId: number, updateCoachDto: IUpdateCoach) {
    let imageKey: string | null = null;
    let updateData: Partial<CoachEntity> = {};

    try {
      const coach = await this.findCoachById(coachId, { notFoundError: true });

      Object.keys(updateCoachDto).forEach((key) => {
        if (updateCoachDto[key] !== undefined && updateCoachDto[key] !== coach[key]) {
          updateData[key] = updateCoachDto[key];
        }
      });

      if (updateCoachDto.image) {
        imageKey = await this.uploadCoachImage(updateCoachDto.image);
        updateData.image_url = imageKey;
      }

      if (Object.keys(updateData).length > 0) {
        await this.coachRepository.update(coachId, updateData);
      }

      if (updateCoachDto.image && coach.image_url) {
        await this.awsService.deleteFile(coach.image_url);
      }

      this.clearUsersCache();
      return ResponseUtil.success({ ...coach, ...updateData }, CoachMessages.UpdatedCoach);
    } catch (error) {
      await this.removeCoachImage(imageKey);

      return ResponseUtil.error(error?.message || CoachMessages.FailedToUpdateCoach, error?.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getAll(query: ICoachQuery): Promise<PageDto<CoachEntity>> {
    const { take, page } = query.paginationDto;
    const cacheKey = `${CacheKeys.COACH_LIST}-${page}-${take}`;

    const cachedData = await this.cacheService.get<PageDto<CoachEntity>>(cacheKey);
    if (cachedData) return cachedData;

    const queryBuilder = this.coachRepository.createQueryBuilder(EntityName.Coaches);

    const [coaches, count] = await queryBuilder
      .skip((page - 1) * take)
      .take(take)
      .getManyAndCount();

    const pageMetaDto = new PageMetaDto(count, query?.paginationDto);
    const result = new PageDto(coaches, pageMetaDto);

    await this.cacheService.set(cacheKey, result, 600);

    return result;
  }
  async findOneById(coachId: number): Promise<ServiceResponse> {
    try {
      const coach = await this.findCoachById(coachId, { notFoundError: true });

      return ResponseUtil.success(coach, CoachMessages.RemovedCoachSuccess);
    } catch (error) {
      throw new RpcException(error);
    }
  }
  async removeById(coachId: number): Promise<ServiceResponse> {
    const queryRunner = this.coachRepository.manager.connection.createQueryRunner();
    await queryRunner.startTransaction();

    try {
      const coach = await this.findCoachById(coachId, { notFoundError: true });

      await this.removeUserById(Number(coach?.user_id));

      const removedCoach = await queryRunner.manager.delete(CoachEntity, coach.id);
      await queryRunner.commitTransaction();

      if (removedCoach.affected) this.removeCoachImage(coach?.image_url);

      return ResponseUtil.success(coach, CoachMessages.RemovedCoachSuccess);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new RpcException(error);
    } finally {
      await queryRunner.release();
    }
  }

  private async createUser(): Promise<number | null> {
    const data = { username: `STU_${Date.now()}_${Math.floor(Math.random() * 1000)}` };

    await this.checkUserServiceConnection();
    const result = await lastValueFrom(this.userServiceClientProxy.send(UserPatterns.CreateUserCoach, data).pipe(timeout(this.timeout)));

    if (result?.error) throw result;
    return result?.data?.user?.id;
  }
  private async removeUserById(userId: number) {
    if (!userId) return null;

    await this.checkUserServiceConnection();
    const result = await lastValueFrom(this.userServiceClientProxy.send(UserPatterns.RemoveUser, { userId }).pipe(timeout(this.timeout)));
    if (result?.error) throw result;
  }

  private async uploadCoachImage(image: any): Promise<string | null> {
    if (!image) return null;

    const uploadedImage = await this.awsService.uploadSingleFile({ file: image, folderName: 'coaches' });
    return uploadedImage.key;
  }
  private async removeCoachImage(imageKey: string): Promise<string | null> {
    if (!imageKey) return null;

    await this.awsService.deleteFile(imageKey);
  }

  async findCoach(field: keyof CoachEntity, value: any, notFoundError = false, duplicateError = false) {
    const coach = await this.coachRepository.findOneBy({ [field]: value });

    if (!coach && notFoundError) throw new NotFoundException(CoachMessages.NotFoundCoach);
    if (coach && duplicateError) throw new ConflictException(CoachMessages.DuplicateNationalCode);

    return coach;
  }
  async findCoachById(coachId: number, { notFoundError = false }) {
    return this.findCoach('id', coachId, notFoundError);
  }
  async findCoachByNationalCode(nationalCode: string, { duplicateError = false, notFoundError = false }) {
    return this.findCoach('national_code', nationalCode, notFoundError, duplicateError);
  }

  async clearUsersCache(): Promise<void> {
    await this.cacheService.delByPattern(CachePatterns.COACH_LIST);
  }
}
