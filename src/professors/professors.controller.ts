import { Controller, Get, Param, Query, ParseIntPipe } from '@nestjs/common';
import { ProfessorsService } from './professors.service';
import { SearchProfessorDto } from './dto/search-professor.dto';
import {
  PaginatedProfessorsResponseDto,
  ProfessorDetailResponseDto,
} from './dto/professor-response.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

@ApiTags('professors')
@Controller('professors')
export class ProfessorsController {
  constructor(private readonly professorsService: ProfessorsService) {}

  @Get()
  @ApiOperation({
    summary: 'Buscar profesores',
    description:
      'Permite buscar profesores por nombre y aplicar diversos filtros',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista paginada de profesores',
    type: PaginatedProfessorsResponseDto,
  })
  async findAll(
    @Query() searchDto: SearchProfessorDto,
  ): Promise<PaginatedProfessorsResponseDto> {
    return this.professorsService.findAll(searchDto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener detalles de un profesor',
    description: 'Devuelve información detallada de un profesor específico',
  })
  @ApiResponse({
    status: 200,
    description: 'Detalles del profesor',
    type: ProfessorDetailResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Profesor no encontrado' })
  @ApiParam({ name: 'id', description: 'ID del profesor' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ProfessorDetailResponseDto> {
    return this.professorsService.findOne(id);
  }
}
