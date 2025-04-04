export interface ICreateCourse {
  title: string;
  description?: string;
  beltIds: number[];
  cover_image?: string;
  intro_video?: string;
}

export type IUpdateCourse = Partial<ICreateCourse>;

export interface ISearchCourseQuery {
  search?: string;
  sort_order?: 'asc' | 'desc';
}
