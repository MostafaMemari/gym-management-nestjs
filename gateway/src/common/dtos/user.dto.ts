import { ApiProperty } from "@nestjs/swagger"
import { IsNotEmpty, IsString } from "class-validator"
import { PaginationDto } from "./shared.dto"

export class SearchDto extends PaginationDto {
    @IsNotEmpty()
    @IsString()
    @ApiProperty()
    query: string
}
