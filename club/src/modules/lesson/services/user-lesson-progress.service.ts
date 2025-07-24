import { Injectable } from '@nestjs/common';

import { UserLessonProgressRepository } from '../repositories/user-lesson-progress.repository';
import { LessonMessages } from '../enums/lesson.message';
import { ResponseUtil } from 'src/common/utils/response';

@Injectable()
export class UserLessonProgressService {
  constructor(private readonly progressRepository: UserLessonProgressRepository) {}

  async markLessonCompleted(userId: number, lessonId: number): Promise<any> {
    try {
      this.progressRepository.markLessonCompleted(userId, lessonId);

      return ResponseUtil.success({}, LessonMessages.LESSON_MARKED_COMPLETE);
    } catch (error) {
      ResponseUtil.error(error?.message || LessonMessages.LESSON_COMPLETE_FAILURE, error?.status);
    }
  }
}
