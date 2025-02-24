import { BadRequestException, ConflictException, HttpStatus, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { lastValueFrom, timeout } from 'rxjs';

import { CoachEntity } from './entities/coach.entity';
import { CoachMessages } from './enums/coach.message';
import { ICreateCoach, IQuery, IUpdateCoach } from './interfaces/coach.interface';
import { CoachRepository } from './repositories/coach.repository';

import { ClubService } from '../club/club.service';
import { ICreateClub } from '../club/interfaces/club.interface';
import { AwsService } from '../s3AWS/s3AWS.service';

import { PageDto, PageMetaDto } from '../../common/dtos/pagination.dto';
import { EntityName } from '../../common/enums/entity.enum';
import { Gender } from '../../common/enums/gender.enum';
import { UserPatterns } from '../../common/enums/patterns.events';
import { Services } from '../../common/enums/services.enum';
import { IPagination } from '../../common/interfaces/pagination.interface';
import { ServiceResponse } from '../../common/interfaces/serviceResponse.interface';
import { IUser } from '../../common/interfaces/user.interface';
import { ResponseUtil } from '../../common/utils/response';
import { isGenderAllowed } from '../../common/utils/functions';

@Injectable()
export class CoachService {
  private readonly timeout: number = 4500;

  constructor(
    @Inject(Services.USER) private readonly userServiceClientProxy: ClientProxy,
    private readonly coachRepository: CoachRepository,
    private readonly awsService: AwsService,
    private readonly clubService: ClubService,
  ) {}

  async checkUserServiceConnection(): Promise<ServiceResponse | void> {
    try {
      await lastValueFrom(this.userServiceClientProxy.send(UserPatterns.CheckConnection, {}).pipe(timeout(this.timeout)));
    } catch (error) {
      console.log(error);
      throw new RpcException({ message: 'User service is not connected', status: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }

  async create(user: IUser, createCoachDto: ICreateCoach) {
    const { clubIds } = createCoachDto;

    let userId = null;
    let imageKey = null;

    try {
      // const ownedClubs = await this.clubService.findOwnedClubs(user.id, clubIds);
      // this.validateCoachGender(createCoachDto.gender, ownedClubs);

      imageKey = await this.uploadCoachImage(createCoachDto.image);
      userId = await this.createUserCoach();

      const coach = await this.coachRepository.createCoachWithTransaction({
        ...createCoachDto,
        image_url: imageKey,
        userId: userId,
        // clubs: ownedClubs,
      });

      return ResponseUtil.success({ ...coach, userId: userId }, CoachMessages.CreatedCoach);
    } catch (error) {
      await this.removeUserById(userId);
      await this.removeCoachImage(imageKey);
      ResponseUtil.error(error?.message || CoachMessages.FailedToCreateCoach, error?.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  async updateById(user: IUser, coachId: number, updateCoachDto: IUpdateCoach) {
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

      return ResponseUtil.success({ ...coach, ...updateData }, CoachMessages.UpdatedCoach);
    } catch (error) {
      await this.removeCoachImage(imageKey);

      return ResponseUtil.error(error?.message || CoachMessages.FailedToUpdateCoach, error?.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getAll(user: IUser, query: { queryDto: IQuery; paginationDto: IPagination }): Promise<PageDto<CoachEntity>> {
    const { take, page } = query.paginationDto;
    // const cacheKey = `${CacheKeys.COACH_LIST}-${page}-${take}`;

    // const cachedData = await this.cacheService.get<PageDto<CoachEntity>>(cacheKey);
    // if (cachedData) return cachedData;

    const queryBuilder = this.coachRepository.createQueryBuilder(EntityName.Coaches);

    const [coaches, count] = await queryBuilder
      .leftJoinAndSelect('coaches.clubs', 'club')
      .where('club.ownerId = :userId', { userId: user.id })
      .skip((page - 1) * take)
      .take(take)
      .getManyAndCount();

    const pageMetaDto = new PageMetaDto(count, query?.paginationDto);
    const result = new PageDto(coaches, pageMetaDto);

    // await this.cacheService.set(cacheKey, result, 600);

    return result;
  }
  async findOneById(user: IUser, coachId: number): Promise<ServiceResponse> {
    try {
      const coach = await this.checkCoachOwnership(coachId, user.id);

      return ResponseUtil.success(coach, CoachMessages.RemovedCoachSuccess);
    } catch (error) {
      throw new RpcException(error);
    }
  }
  async removeById(user: IUser, coachId: number): Promise<ServiceResponse> {
    try {
      const coach = await this.checkCoachOwnership(coachId, user.id);
      // await this.ensureCoachHasNoRelations(coachId);

      await this.removeUserById(Number(coach.userId));

      if (coach.image_url) await this.removeCoachImage(coach.image_url);

      const removedCoach = await this.coachRepository.removeCoachWithTransaction(coachId);

      return ResponseUtil.success(removedCoach, CoachMessages.RemovedCoachSuccess);
    } catch (error) {
      throw new RpcException(error);
    }
  }

  private async createUserCoach(): Promise<number | null> {
    const data = { username: `COA_${Date.now()}_${Math.floor(Math.random() * 1000)}` };

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

  async checkCoachOwnership(coachId: number, userId: number): Promise<CoachEntity> {
    const coach = await this.coachRepository.findOne({ where: { id: coachId }, relations: ['clubs'] });

    if (!coach) throw new BadRequestException(CoachMessages.CoachNotBelongToUser);

    const isCoachInUserClubs = coach.clubs.some((club) => club.ownerId === userId);
    if (!isCoachInUserClubs) throw new BadRequestException(CoachMessages.CoachNotBelongToUser);

    return coach;
  }

  async ensureCoachHasNoRelations(coachId: number): Promise<void> {
    const coachWithRelations = await this.coachRepository
      .createQueryBuilder('coach')
      .leftJoin('coach.students', 'student')
      .leftJoin('coach.clubs', 'club')
      .where('coach.id = :coachId', { coachId })
      .andWhere('(student.id IS NOT NULL OR club.id IS NOT NULL)')
      .getOne();

    if (coachWithRelations) {
      throw new BadRequestException(CoachMessages.CoachHasRelations);
    }
  }

  private validateCoachGender(coachGender: Gender, clubs: ICreateClub[]): void {
    const invalidClubs = clubs.filter((club) => !isGenderAllowed(coachGender, club.genders)).map((club) => club.id);

    if (invalidClubs.length > 0) throw new BadRequestException(`${CoachMessages.CoachGenderMismatch} ${invalidClubs.join(', ')}`);
  }
}
