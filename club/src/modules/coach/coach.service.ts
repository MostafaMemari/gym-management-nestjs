import { BadRequestException, ConflictException, forwardRef, HttpStatus, Inject, Injectable, NotFoundException } from '@nestjs/common';
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
import { ClubEntity } from '../club/entities/club.entity';
import { StudentService } from '../student/student.service';

@Injectable()
export class CoachService {
  private readonly timeout: number = 4500;

  constructor(
    @Inject(Services.USER) private readonly userServiceClientProxy: ClientProxy,
    private readonly coachRepository: CoachRepository,
    private readonly awsService: AwsService,
    private readonly clubService: ClubService,
    @Inject(forwardRef(() => StudentService)) private readonly studentService: StudentService,
  ) {}

  async checkUserServiceConnection(): Promise<ServiceResponse | void> {
    try {
      await lastValueFrom(this.userServiceClientProxy.send(UserPatterns.CheckConnection, {}).pipe(timeout(this.timeout)));
    } catch (error) {
      throw new RpcException({ message: 'User service is not connected', status: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }

  async create(user: IUser, createCoachDto: ICreateCoach) {
    // let createData: Partial<CoachEntity> = ICreateCoach;

    const { clubIds, national_code, gender, image } = createCoachDto;
    let userId: number = user.id;
    let imageKey: string | null = null;

    try {
      if (national_code) await this.ensureUniqueNationalCode(national_code, userId);

      const ownedClubs = clubIds?.length ? await this.clubService.findOwnedClubs(clubIds, userId) : [];
      this.validateCoachGender(gender, ownedClubs);

      imageKey = image ? await this.uploadCoachImage(image) : null;

      // createCoachDto.clubs = ownedClubs;

      userId = await this.createUserCoach();
      const coach = await this.coachRepository.createCoachWithTransaction({
        ...createCoachDto,
        image_url: imageKey,
        userId,
      });

      return ResponseUtil.success({ ...coach, userId }, CoachMessages.CreatedCoach);
    } catch (error) {
      await this.rollbackCoachCreation(userId, imageKey);
      return ResponseUtil.error(error?.message || CoachMessages.FailedToCreateCoach, error?.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async update(user: IUser, coachId: number, updateCoachDto: IUpdateCoach) {
    const { clubIds, national_code, gender, image } = updateCoachDto;
    const userId: number = user.id;
    let imageKey: string | null = null;
    let updateData: Partial<CoachEntity> = {};

    try {
      let coach = national_code ? await this.ensureUniqueNationalCode(national_code, userId) : null;
      if (!coach) coach = await this.validateOwnership(coachId, userId);

      const ownedClubs = clubIds?.length ? await this.clubService.findOwnedClubs(clubIds, userId) : coach.clubs;
      this.validateCoachGender(gender || coach.gender, ownedClubs);

      const removedClubs = coach.clubs.filter((club) => !clubIds.includes(club.id));
      await this.studentService.hasStudentsInClub(removedClubs, coachId);

      Object.keys(updateCoachDto).forEach((key) => {
        if (key !== 'image' && key !== 'clubIds' && updateCoachDto[key] !== undefined && updateCoachDto[key] !== coach[key]) {
          updateData[key] = updateCoachDto[key];
        }
      });

      if (image) {
        imageKey = await this.uploadCoachImage(image);
        updateData.image_url = imageKey;
      }

      updateData.clubs = ownedClubs;

      await this.coachRepository.updateCoach(coach, updateData);

      if (image && coach.image_url) await this.awsService.deleteFile(coach.image_url);

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
      const coach = await this.validateOwnership(coachId, user.id);

      return ResponseUtil.success(coach, CoachMessages.RemovedCoachSuccess);
    } catch (error) {
      throw new RpcException(error);
    }
  }
  async removeById(user: IUser, coachId: number): Promise<ServiceResponse> {
    try {
      const coach = await this.validateOwnership(coachId, user.id);
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

  async validateOwnership(coachId: number, userId: number): Promise<CoachEntity> {
    const queryBuilder = this.coachRepository.createQueryBuilder(EntityName.Coaches);

    const coach = await queryBuilder
      .where('coaches.id = :coachId', { coachId })
      .leftJoinAndSelect('coaches.clubs', 'club')
      .andWhere('club.ownerId = :userId', { userId })
      .getOne();

    if (!coach) throw new BadRequestException(CoachMessages.CoachNotFound);

    return coach;
  }

  async ensureUniqueNationalCode(nationalCode: string, userId: number): Promise<CoachEntity> {
    const queryBuilder = this.coachRepository.createQueryBuilder(EntityName.Coaches);

    const coach = await queryBuilder
      .where('coaches.national_code = :nationalCode', { nationalCode })
      .leftJoinAndSelect('coaches.clubs', 'club')
      .andWhere('club.ownerId = :userId', { userId })
      .getOne();

    if (coach) throw new BadRequestException(CoachMessages.DuplicateNationalCode);

    return coach;
  }

  async ensureCoachHasNoRelations(coachId: number): Promise<void> {
    const coachWithRelations = await this.coachRepository
      .createQueryBuilder('coach')
      .leftJoin('coach.coaches', 'student')
      .leftJoin('coach.clubs', 'club')
      .where('coach.id = :coachId', { coachId })
      .andWhere('(student.id IS NOT NULL OR club.id IS NOT NULL)')
      .getOne();

    if (coachWithRelations) {
      throw new BadRequestException(CoachMessages.CoachHasRelations);
    }
  }

  validateCoachGender(coachGender: Gender, clubs: ICreateClub[]): void {
    const invalidClubs = clubs.filter((club) => !isGenderAllowed(coachGender, club.genders)).map((club) => club.id);

    if (invalidClubs.length > 0) throw new BadRequestException(`${CoachMessages.CoachGenderMismatch} ${invalidClubs.join(', ')}`);
  }

  private async rollbackCoachCreation(userId: number, imageKey: string | null) {
    if (userId) await this.removeUserById(userId);
    if (imageKey) await this.removeCoachImage(imageKey);
  }
}
