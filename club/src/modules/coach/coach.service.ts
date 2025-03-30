import { BadRequestException, forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom, timeout } from 'rxjs';

import { CoachEntity } from './entities/coach.entity';
import { CoachMessages } from './enums/coach.message';
import { ICoachCreateDto, ICoachFilter, ICoachUpdateDto } from './interfaces/coach.interface';
import { CoachRepository } from './repositories/coach.repository';

import { GymService } from '../gym/gym.service';
import { GymEntity } from '../gym/entities/gym.entity';
import { ICreateGym } from '../gym/interfaces/gym.interface';
import { AwsService } from '../s3AWS/s3AWS.service';
import { StudentService } from '../student/student.service';

import { PageDto, PageMetaDto } from '../../common/dtos/pagination.dto';
import { Gender } from '../../common/enums/gender.enum';
import { UserPatterns } from '../../common/enums/patterns.events';
import { Services } from '../../common/enums/services.enum';
import { IPagination } from '../../common/interfaces/pagination.interface';
import { ServiceResponse } from '../../common/interfaces/serviceResponse.interface';
import { IUser } from '../../common/interfaces/user.interface';
import { checkConnection } from '../../common/utils/checkConnection.utils';
import { isGenderAllowed } from '../../common/utils/functions';
import { ResponseUtil } from '../../common/utils/response';

@Injectable()
export class CoachService {
  private readonly timeout: number = 4500;

  constructor(
    @Inject(Services.USER) private readonly userServiceClientProxy: ClientProxy,
    private readonly coachRepository: CoachRepository,

    private readonly awsService: AwsService,
    private readonly studentService: StudentService,
    @Inject(forwardRef(() => GymService)) private readonly gymService: GymService,
  ) {}

  async create(user: IUser, createCoachDto: ICoachCreateDto): Promise<ServiceResponse> {
    const { gym_ids, national_code, gender, image } = createCoachDto;

    let imageKey: string | null = null;
    let coachUserId: number | null = null;
    let ownedGyms: GymEntity[] | null;

    try {
      if (national_code) await this.validateUniqueNationalCode(national_code);

      if (gym_ids) {
        ownedGyms = await this.gymService.validateOwnershipByIds(gym_ids, user.id);
        this.validateCoachGymGender(gender, ownedGyms);
      }

      imageKey = image ? await this.updateImage(image) : null;
      coachUserId = await this.createUserCoach();

      const coach = await this.coachRepository.createCoachWithTransaction({
        ...createCoachDto,
        image_url: imageKey,
        gyms: ownedGyms,
        user_id: coachUserId,
      });

      return ResponseUtil.success({ ...coach, userId: coachUserId }, CoachMessages.CREATE_SUCCESS);
    } catch (error) {
      await this.removeCoachData(coachUserId, imageKey);
      ResponseUtil.error(error?.message || CoachMessages.CREATE_FAILURE, error?.status);
    }
  }
  async update(adminId: number, coachId: number, updateCoachDto: ICoachUpdateDto): Promise<ServiceResponse> {
    const { gym_ids = [], national_code, gender, image } = updateCoachDto;

    let imageKey: string | null = null;

    try {
      let coach = national_code ? await this.validateUniqueNationalCode(national_code) : null;
      if (!coach) coach = await this.validateByAdmin(coachId, adminId);

      const updateData = this.prepareUpdateData(updateCoachDto, coach);

      if (gym_ids.length) {
        const ownedGyms = gym_ids?.length ? await this.gymService.validateOwnershipByIds(gym_ids, adminId) : coach.gyms;
        const removedGyms = coach.gyms.filter((gym) => !gym_ids.includes(gym.id));
        if (removedGyms.length) await this.studentService.validateRemovedGymsStudents(removedGyms, coachId);
        this.validateCoachGymGender(coach.gender, ownedGyms);
        updateData.gyms = ownedGyms;
      } else {
        await this.studentService.validateRemovedGymsStudents(coach.gyms, coachId);
        this.validateCoachGymGender(coach.gender, coach.gyms);
        updateData.gyms = [];
      }

      if (gender && gender !== coach.gender) {
        this.validateCoachGymGender(gender, updateData.gyms ?? coach.gyms);
        await this.validateCoachGenderChange(gender, coachId);
      }

      if (image) updateData.image_url = await this.updateImage(image);

      await this.coachRepository.updateCoach(coach, { ...updateData });

      if (image && updateData.image_url && coach.image_url) await this.awsService.deleteFile(coach.image_url);

      return ResponseUtil.success({ ...coach, ...updateData }, CoachMessages.UPDATE_SUCCESS);
    } catch (error) {
      await this.removeImage(imageKey);
      ResponseUtil.error(error?.message || CoachMessages.UPDATE_FAILURE, error?.status);
    }
  }
  async getAll(user: IUser, query: { queryCoachDto: ICoachFilter; paginationDto: IPagination }): Promise<ServiceResponse> {
    const { take, page } = query.paginationDto;
    const userId: number = user.id;

    try {
      const [coaches, count] = await this.coachRepository.getCoachesWithFilters(userId, query.queryCoachDto, page, take);

      const pageMetaDto = new PageMetaDto(count, query?.paginationDto);
      const result = new PageDto(coaches, pageMetaDto);

      return ResponseUtil.success(result.data, CoachMessages.GET_ALL_SUCCESS);
    } catch (error) {
      ResponseUtil.error(error?.message || CoachMessages.GET_ALL_FAILURE, error?.status);
    }
  }
  async findOneById(user: IUser, coachId: number): Promise<ServiceResponse> {
    try {
      const coach = await this.validateByAdmin(coachId, user.id);

      return ResponseUtil.success(coach, CoachMessages.GET_SUCCESS);
    } catch (error) {
      ResponseUtil.error(error?.message || CoachMessages.GET_FAILURE, error?.status);
    }
  }
  async removeById(user: IUser, coachId: number): Promise<ServiceResponse> {
    const userId = user.id;
    try {
      const coach = await this.validateByAdmin(coachId, userId);

      const hasStudents = await this.studentService.hasStudentsAssignedToCoach(coachId);
      if (hasStudents) throw new BadRequestException(CoachMessages.COACH_HAS_STUDENTS.replace('{coachId}', coachId.toString()));

      await this.coachRepository.removeCoach(coach);

      await this.removeCoachData(Number(coach.user_id), coach.image_url);

      return ResponseUtil.success(coach, CoachMessages.REMOVE_SUCCESS);
    } catch (error) {
      ResponseUtil.error(error?.message || CoachMessages.REMOVE_FAILURE, error?.status);
    }
  }
  async getOneByNationalCode(nationalCode: string): Promise<ServiceResponse> {
    try {
      const coach = await this.coachRepository.findOneBy({ national_code: nationalCode });
      if (!coach) throw new NotFoundException(CoachMessages.NOT_FOUND);
      return ResponseUtil.success(coach, CoachMessages.GET_SUCCESS);
    } catch (error) {
      ResponseUtil.error(error?.message || CoachMessages.UPDATE_FAILURE, error?.status);
    }
  }

  async validateByAdmin(coachId: number, adminId: number): Promise<CoachEntity> {
    const coach = await this.coachRepository.findByIdAndAdmin(coachId);
    if (!coach) throw new NotFoundException(CoachMessages.NOT_FOUND);
    return coach;
  }

  private async createUserCoach(): Promise<number> {
    const username = `COA_${Math.random().toString(36).slice(2, 8)}`;

    await checkConnection(Services.USER, this.userServiceClientProxy, { pattern: UserPatterns.CHECK_CONNECTION });

    const result = await lastValueFrom(
      this.userServiceClientProxy.send(UserPatterns.CREATE_COACH, { username }).pipe(timeout(this.timeout)),
    );

    if (result?.error) throw result;
    return result?.data?.user?.id;
  }
  private async removeCoachUserById(userId: number): Promise<void> {
    if (!userId) return;

    await checkConnection(Services.USER, this.userServiceClientProxy, { pattern: UserPatterns.CHECK_CONNECTION });

    const result = await lastValueFrom(this.userServiceClientProxy.send(UserPatterns.REMOVE_ONE, { userId }).pipe(timeout(this.timeout)));

    if (result?.error) throw new BadRequestException(result.error);
  }
  private async updateImage(image: Express.Multer.File): Promise<string | undefined> {
    if (!image) return;

    const uploadedImage = await this.awsService.uploadSingleFile({ file: image, folderName: 'coaches' });
    return uploadedImage.key;
    // return (await this.awsService.uploadSingleFile({ file: image, folderName: 'coaches' }))?.key;
  }
  private async removeImage(imageKey: string): Promise<void> {
    if (!imageKey) return;
    await this.awsService.deleteFile(imageKey);
  }
  async validateUniqueNationalCode(nationalCode: string): Promise<CoachEntity> {
    const coach = await this.coachRepository.findCoachByNationalCode(nationalCode);
    if (coach) throw new BadRequestException(CoachMessages.DUPLICATE_ENTRY);
    return coach;
  }
  private async removeCoachData(coachUserId: number, imageKey: string | null) {
    await Promise.all([
      coachUserId ? this.removeCoachUserById(coachUserId) : Promise.resolve(),
      imageKey ? this.removeImage(imageKey) : Promise.resolve(),
    ]);
  }

  private validateCoachGymGender(coachGender: Gender, gyms: ICreateGym[]): void {
    const invalidGyms = gyms.filter((gym) => !isGenderAllowed(coachGender, gym.genders)).map((gym) => gym.id);

    if (invalidGyms.length > 0) {
      throw new BadRequestException(CoachMessages.COACH_GENDER_MISMATCH.replace('{ids}', invalidGyms.join(', ')));
    }
  }
  private async validateCoachGenderChange(coachGender: Gender, coachId: number): Promise<void> {
    const hasInvalidStudent = await this.studentService.validateGenderCoachStudent(
      coachId,
      coachGender === Gender.Male ? Gender.Female : Gender.Male,
    );

    if (hasInvalidStudent) throw new BadRequestException(CoachMessages.COACH_GENDER_CHANGE_NOT_ALLOWED);
  }
  private prepareUpdateData(updateDto: ICoachUpdateDto, coach: CoachEntity): Partial<CoachEntity> {
    return Object.fromEntries(
      Object.entries(updateDto).filter(
        ([key, value]) => key !== 'image' && key !== 'gym_ids' && value !== undefined && value !== coach[key],
      ),
    );
  }

  async hasCoachWithGenderInGym(gymId: number, coachGender: Gender): Promise<boolean> {
    return this.coachRepository.existsCoachByGenderInGym(gymId, coachGender);
  }
  async hasCoachByGymId(gymId: number): Promise<boolean> {
    return this.coachRepository.existsCoachByGymId(gymId);
  }
}
