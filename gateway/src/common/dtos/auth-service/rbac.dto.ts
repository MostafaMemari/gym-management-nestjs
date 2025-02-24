import { ApiProperty } from "@nestjs/swagger"
import { IsEnum, IsNumber, IsPositive } from "class-validator"
import { Role } from "../../../common/enums/role.enum"

export class AssignRoleDto {
    @ApiProperty()
    @IsNumber()
    @IsPositive()
    userId: number

    @ApiProperty({
        enum: Role
    })
    @IsEnum(Role)
    role: Role
}