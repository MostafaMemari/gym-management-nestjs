export interface ICreateLesson {
  title: string;
  content?: string;
  chapterId: number;
  cover_image?: Express.Multer.File;
  video?: Express.Multer.File;
}

export type IUpdateLesson = Partial<ICreateLesson>;

export interface ISearchLessonQuery {
  search?: string;
  sort_order?: 'asc' | 'desc';
}
