export class PageMetaDto {
  readonly currentPage: number;
  readonly perPage: number;
  readonly totalCount: number;
  readonly totalPages: number;
  readonly hasPreviousPage: boolean;
  readonly hasNextPage: boolean;

  constructor(itemCount: number, pageOptionsDto: { page?: number; take?: number; skip?: number }) {
    this.currentPage = pageOptionsDto.page;
    this.totalCount = itemCount;
    this.perPage = pageOptionsDto.take;
    this.totalPages = Math.ceil(this.totalCount / this.perPage);
    this.hasNextPage = this.currentPage < this.totalPages;
    this.hasPreviousPage = this.currentPage > 1;
  }
}

export class PageDto<T> {
  readonly data: { items: T[]; pager: PageMetaDto };

  constructor(items: T[], meta: PageMetaDto) {
    this.data = {
      pager: meta,
      items: items,
    };
  }
}
