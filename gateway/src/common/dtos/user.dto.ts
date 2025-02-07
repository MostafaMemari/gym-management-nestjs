import { ApiPropertyOptional } from "@nestjs/swagger"
import { Transform } from "class-transformer"
import { IsNumber, IsOptional, IsPositive } from "class-validator"

export class PaginationDto {
    @ApiPropertyOptional()
    @IsNumber()
    @IsPositive()
    @IsOptional()
    @Transform(({value}) => +value)
    page: number = 1

    @ApiPropertyOptional()
    @IsNumber()
    @IsPositive()
    @IsOptional()
    @Transform(({ value }) => +value)
    count: number = 20
}