import { BadRequestException, forwardRef, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { lastValueFrom, timeout } from 'rxjs';

import { CoachEntity } from './entities/coach.entity';
import { CoachMessages } from './enums/coach.message';
import { ICreateCoach, ISeachCoachQuery, IUpdateCoach } from './interfaces/coach.interface';
import { CoachRepository } from './repositories/coach.repository';

import { ClubService } from '../club/club.service';
import { ICreateClub } from '../club/interfaces/club.interface';
import { AwsService } from '../s3AWS/s3AWS.service';

import { PageDto, PageMetaDto } from '../../common/dtos/pagination.dto';
import { Gender } from '../../common/enums/gender.enum';
import { UserPatterns } from '../../common/enums/patterns.events';
import { Services } from '../../common/enums/services.enum';
import { IPagination } from '../../common/interfaces/pagination.interface';
import { ServiceResponse } from '../../common/interfaces/serviceResponse.interface';
import { IUser } from '../../common/interfaces/user.interface';
import { isGenderAllowed } from '../../common/utils/functions';
import { ResponseUtil } from '../../common/utils/response';
import { ClubEntity } from '../club/entities/club.entity';
import { StudentService } from '../student/student.service';
import { CacheKeys } from '../../common/enums/cache.enum';
import { CacheService } from '../cache/cache.service';

@Injectable()
export class CoachService {
  private readonly timeout: number = 4500;

  constructor(
    @Inject(Services.USER) private readonly userServiceClientProxy: ClientProxy,
    private readonly coachRepository: CoachRepository,

    private readonly awsService: AwsService,
    private readonly cacheService: CacheService,
    @Inject(forwardRef(() => ClubService)) private readonly clubService: ClubService,
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
    const { clubIds, national_code, gender, image } = createCoachDto;
    const userId: number = user.id;

    let imageKey: string | null = null;
    let coachUserId: number | null = null;

    try {
      if (national_code) await this.ensureUniqueNationalCode(national_code, userId);

      const ownedClubs = await this.clubService.findOwnedClubs(clubIds, userId);
      await this.validateCoachGender(gender, ownedClubs);

      imageKey = image ? await this.uploadCoachImage(image) : null;

      coachUserId = await this.createUserCoach();

      const coach = await this.coachRepository.createCoachWithTransaction({
        ...createCoachDto,
        image_url: imageKey,
        clubs: ownedClubs,
        userId: coachUserId,
      });

      return ResponseUtil.success({ ...coach, userId: coachUserId }, CoachMessages.CreatedCoach);
    } catch (error) {
      await this.removeCoachUserAndImage(coachUserId, imageKey);
      return ResponseUtil.error(error?.message || CoachMessages.FailedToCreateCoach, error?.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async update(user: IUser, coachId: number, updateCoachDto: IUpdateCoach) {
    const { clubIds = [], national_code, gender, image } = updateCoachDto;
    const userId: number = user.id;

    let imageKey: string | null = null;

    try {
      let coach = national_code ? await this.ensureUniqueNationalCode(national_code, userId) : null;
      if (!coach) coach = await this.validateOwnership(coachId, userId);

      const updateData = this.prepareUpdateData(updateCoachDto, coach);

      if (clubIds.length) {
        const ownedClubs = clubIds?.length ? await this.clubService.findOwnedClubs(clubIds, userId) : coach.clubs;
        const removedClubs = coach.clubs.filter((club) => !clubIds.includes(club.id));
        if (removedClubs.length) await this.studentService.hasStudentsInClub(removedClubs, coachId);
        await this.validateCoachGender(coach.gender, ownedClubs);
        updateData.clubs = ownedClubs;
      }

      if (gender !== coach.gender) await this.validateCoachGender(gender, updateData.clubs ?? coach.clubs, coachId);

      if (image) updateData.image_url = await this.uploadCoachImage(image);

      await this.coachRepository.updateCoach(coach, { ...updateData });

      if (image && updateData.image_url && coach.image_url) await this.awsService.deleteFile(coach.image_url);

      return ResponseUtil.success({ ...coach, ...updateData }, CoachMessages.UpdatedCoach);
    } catch (error) {
      await this.removeCoachImage(imageKey);
      return ResponseUtil.error(error?.message || CoachMessages.FailedToUpdateCoach, error?.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getAll(user: IUser, query: { queryCoachDto: ISeachCoachQuery; paginationDto: IPagination }): Promise<PageDto<CoachEntity>> {
    const { take, page } = query.paginationDto;
    const userId: number = user.id;

    const cacheKey = `${CacheKeys.COACH_LIST}:${user.id}-${page}-${take}-${JSON.stringify(query.queryCoachDto)}`;

    const cachedData = await this.cacheService.get<PageDto<CoachEntity>>(cacheKey);
    if (cachedData) return cachedData;

    const [coaches, count] = await this.coachRepository.getCoachesWithFilters(userId, query.queryCoachDto, page, take);

    const pageMetaDto = new PageMetaDto(count, query?.paginationDto);
    const result = new PageDto(coaches, pageMetaDto);

    await this.cacheService.set(cacheKey, result, 60);

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

      const hasStudents = await this.studentService.validateCoachHasNoStudents(coachId);
      if (hasStudents) throw new BadRequestException(CoachMessages.CoachHasStudents);

      const isRemoved = await this.coachRepository.removeCoachById(coachId);

      if (isRemoved) await this.removeCoachUserAndImage(Number(coach.userId), coach.image_url);

      return ResponseUtil.success(coach, CoachMessages.RemovedCoachSuccess);
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

  private async ensureUniqueNationalCode(nationalCode: string, userId: number): Promise<CoachEntity> {
    const coach = await this.coachRepository.findCoachByNationalCode(nationalCode, userId);
    if (coach) throw new BadRequestException(CoachMessages.DuplicateNationalCode);
    return coach;
  }
  async ensureCoachHasNoRelations(coachId: number): Promise<void> {
    const coachWithRelations = await this.coachRepository.findCoachWithRelations(coachId);

    if (coachWithRelations) {
      throw new BadRequestException(CoachMessages.CoachHasRelations);
    }
  }
  private async validateCoachGender(coachGender: Gender, clubs: ICreateClub[], coachId?: number | null): Promise<void> {
    const invalidClubs = clubs.filter((club) => !isGenderAllowed(coachGender, club.genders)).map((club) => club.id);
    if (invalidClubs.length > 0) throw new BadRequestException(`${CoachMessages.CoachGenderMismatch} ${invalidClubs.join(', ')}`);

    if (coachId) {
      const isCheckExistStudent = await this.studentService.isCheckExistsByCoachAndGender(
        coachId,
        coachGender === Gender.Male ? Gender.Female : Gender.Male,
      );
      if (isCheckExistStudent) throw new BadRequestException(CoachMessages.InvalidGenderCoach);
    }
  }
  private prepareUpdateData(updateDto: IUpdateCoach, coach: CoachEntity): Partial<CoachEntity> {
    return Object.keys(updateDto).reduce((acc, key) => {
      if (key !== 'image' && key !== 'clubIds' && updateDto[key] !== undefined && updateDto[key] !== coach[key]) {
        acc[key] = updateDto[key];
      }
      return acc;
    }, {} as Partial<CoachEntity>);
  }
  private async removeCoachUserAndImage(coachUserId: number, imageKey: string | null) {
    if (coachUserId) await this.removeUserById(coachUserId);
    if (imageKey) await this.removeCoachImage(imageKey);
  }

  async isGenderAssignedToCoaches(clubId: number, gender: Gender): Promise<boolean> {
    return await this.coachRepository.existsCoachByGenderInClub(clubId, gender);
  }
  async isClubAssignedToCoaches(clubId: number): Promise<boolean> {
    return await this.coachRepository.existsCoachByClubId(clubId);
  }
  async validateOwnership(coachId: number, userId: number): Promise<CoachEntity> {
    const coach = await this.coachRepository.findCoachByIdAndOwner(coachId, userId);
    if (!coach) throw new BadRequestException(CoachMessages.CoachNotFound);
    return coach;
  }
}
