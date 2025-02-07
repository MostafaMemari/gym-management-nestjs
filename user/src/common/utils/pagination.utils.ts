import { Prisma } from "@prisma/client";
import { IPagination } from "../interfaces/user.interface";
import { PrismaService } from "../../prisma/prisma.service";

export const pagination = async (
    model: Prisma.ModelName,
    prisma: PrismaService,
    paginationParams: IPagination,
    extraQuery: any = {}
) => {
    const { count = 20, page = 1 } = paginationParams

    const skip = (page - 1) * count

    const [data, totalCount] = await Promise.all([
        prisma[model].findMany({
            skip,
            take: count,
            ...extraQuery
        }),
        prisma[model].count({ where: extraQuery.where })
    ])

    return {
        paginatedData: data,
        totalCount,
        totalPages: Math.ceil(totalCount / count),
        currentPage: page,
        hasNextPage: page * count < totalCount,
        hasPreviousPage: page > 1
    }
}