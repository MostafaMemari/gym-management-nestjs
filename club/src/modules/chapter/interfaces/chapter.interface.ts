export interface ICreateChapter {
  title: string;
  description?: string;
  courseId: number;
}

export type IUpdateChapter = Partial<ICreateChapter>;

export interface ISearchChapterQuery {
  search?: string;
  sort_order?: 'asc' | 'desc';
}
