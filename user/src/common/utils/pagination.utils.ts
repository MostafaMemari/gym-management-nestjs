import { IPagination } from "../interfaces/user.interface";

interface OutputPagination<T> {
    paginatedData: T[]
    totalCount: number
    totalPages: number
    currentPage: number
    hasNextPage: boolean
    hasPreviousPage: boolean
}

export const pagination = <T>(
    paginationParams: IPagination,
    data: T[]
): OutputPagination<T> => {
    const { count = 20, page = 1 } = paginationParams

    const skip = (page - 1) * count;

    const total = data.length;

    const pages = Math.ceil(total / count);

    const filteredData = data.slice(skip, skip + count);

    return {
        paginatedData: filteredData,
        totalCount: total,
        totalPages: pages,
        currentPage: page,
        hasNextPage: page * count < total,
        hasPreviousPage: page > 1
    }
};