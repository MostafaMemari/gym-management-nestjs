export interface ICreateCourse {
  title: string;
  description?: string;
  beltId: number;
  cover_image?: Express.Multer.File;
  intro_video?: Express.Multer.File;
}

export type IUpdateCourse = Partial<ICreateCourse>;

export interface ISearchCourseQuery {
  search?: string;
  sort_order?: 'asc' | 'desc';
}
