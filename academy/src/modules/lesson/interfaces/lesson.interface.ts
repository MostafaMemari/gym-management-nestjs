export interface ICreateLesson {
  title: string;
  content?: string;
  chapterId?: number;
  image_cover_key?: string;
  video_key?: string;
  cover_image?: string;
  video?: string;
}

export type IUpdateLesson = Partial<ICreateLesson>;

export interface ISearchLessonQuery {
  search?: string;
  sort_order?: 'asc' | 'desc';
}
