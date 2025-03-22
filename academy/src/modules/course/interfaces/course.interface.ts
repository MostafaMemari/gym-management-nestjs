export interface ICreateCourse {
  title: string;
  description?: string;
  beltIds: number[];
  cover_image?: string;
  intro_video?: string;
  image_cover_key?: string;
  intro_video_key?: string;
}

export type IUpdateCourse = Partial<ICreateCourse>;

export interface ISearchCourseQuery {
  search?: string;
  sort_order?: 'asc' | 'desc';
}
