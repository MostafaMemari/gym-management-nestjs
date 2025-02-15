import { IPagination } from "../interfaces/user.interface";

interface OutputPagination<T> {
    items: T[]
    pager: {
        totalCount: number
        totalPages: number
        currentPage: number
        hasNextPage: boolean
        hasPreviousPage: boolean
    }
}

export const pagination = <T>(
    paginationParams: IPagination,
    data: T[]
): OutputPagination<T> => {
    const { take = 20, page = 1 } = paginationParams

    const skip = (page - 1) * take;

    const total = data.length;

    const pages = Math.ceil(total / take);

    const filteredData = data.slice(skip, skip + take);

    return {
        pager: {
            totalCount: total,
            totalPages: pages,
            currentPage: page,
            hasNextPage: page * take < total,
            hasPreviousPage: page > 1
        },
        items: filteredData,
    }
};