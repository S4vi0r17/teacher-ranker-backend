import {
  IsOptional,
  IsString,
  IsNumber,
  Min,
  Max,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SearchProfessorDto {
  @ApiPropertyOptional({ description: 'Nombre del profesor a buscar' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'ID de la universidad para filtrar',
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  universityId?: number;

  @ApiPropertyOptional({
    description: 'ID de la facultad para filtrar',
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  facultyId?: number;

  @ApiPropertyOptional({ description: 'Departamento para filtrar' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({
    description: 'Calificación mínima (0-5)',
    minimum: 0,
    maximum: 5,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(5)
  minRating?: number;

  @ApiPropertyOptional({
    description: 'Calificación máxima (0-5)',
    minimum: 0,
    maximum: 5,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(5)
  maxRating?: number;

  @ApiPropertyOptional({
    description: 'Número mínimo de reseñas',
    type: Number,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minReviews?: number;

  @ApiPropertyOptional({
    description: 'Número de página',
    example: 1,
    type: Number,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Elementos por página (máx. 100)',
    example: 20,
    type: Number,
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
