import { Injectable } from '@nestjs/common';
import { DataSource, In, Repository } from 'typeorm';
import { UserLessonProgressEntity } from '../entities/user-lesson-progress.entity';

@Injectable()
export class UserLessonProgressRepository extends Repository<UserLessonProgressEntity> {
  constructor(private readonly dataSource: DataSource) {
    super(UserLessonProgressEntity, dataSource.createEntityManager());
  }

  async markLessonCompleted(userId: number, lessonId: number): Promise<void> {
    let progress = await this.findOne({
      where: { userId, lesson: { id: lessonId } },
      relations: ['lesson'],
    });

    if (!progress) {
      progress = this.create({ userId, lesson: { id: lessonId }, is_completed: true });
    } else {
      progress.is_completed = true;
    }

    await this.save(progress);
  }

  async getUserProgress(userId: number, lessonIds: number[]): Promise<UserLessonProgressEntity[]> {
    return this.find({
      where: { userId, lesson: In(lessonIds) },
    });
  }
}
