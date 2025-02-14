import { Injectable } from "@nestjs/common";
import { PrismaService } from "./prisma/prisma.service";
import { Prisma, User } from "@prisma/client";

@Injectable()
export class UserRepository {
    constructor(private readonly prisma: PrismaService) { }

    findAll(args: Prisma.UserFindManyArgs = {}): Promise<User[]> {
        return this.prisma.user.findMany({ ...args })
    }

    findById(id: number, args: Prisma.UserFindFirstArgs = {}): Promise<User | null> {
        return this.prisma.user.findFirst({ where: { id }, ...args })
    }

    create(args: Prisma.UserCreateArgs): Promise<User> {
        return this.prisma.user.create(args)
    }

    update(id: number, args: Prisma.UserUpdateArgs): Promise<User> {
        return this.prisma.user.update({ where: { id }, ...args })
    }

    delete(id: number, args: Omit<Prisma.UserDeleteArgs, 'where'> = {}): Promise<User | null> {
        return this.prisma.user.delete({ where: { id }, ...args })
    }

    async isExistingUser(userDto: Prisma.UserCreateInput): Promise<User | boolean> {
        const user = await this.prisma.user.findFirst({
            where: {
                OR: [
                    {
                        mobile: userDto.mobile
                    },
                    {
                        username: userDto.username
                    }
                ]
            }
        })

        if (user) return user

        return false
    }

    count(): Promise<number> {
        return this.prisma.user.count()
    }

    findOneByUsername(username: string, args: Prisma.UserFindFirstArgs = {}): Promise<User | null> {
        return this.prisma.user.findFirst({ where: { username }, ...args })
    }

    findOneByIdentifier(identifier: string, args: Prisma.UserFindFirstArgs = {}): Promise<User | null> {
        return this.prisma.user.findFirst({
            where: {
                OR: [
                    {
                        username: identifier
                    },
                    {
                        mobile: identifier
                    }
                ]
            },
            ...args
        })
    }
}