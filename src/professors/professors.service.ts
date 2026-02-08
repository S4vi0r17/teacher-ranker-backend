import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@src/prisma/prisma.service';
import { SearchProfessorDto } from './dto/search-professor.dto';
import {
  PaginatedProfessorsResponseDto,
  ProfessorDetailResponseDto,
  ProfessorResponseDto,
} from './dto/professor-response.dto';
import { Prisma } from '@prisma/client';
import {
  ProfessorWithRelations,
  UniversityRelation,
  FacultyRelation,
  CourseRelation,
  TagRelation,
  ReviewWithCourse,
} from './interfaces/professor.interface';

@Injectable()
export class ProfessorsService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    searchDto: SearchProfessorDto,
  ): Promise<PaginatedProfessorsResponseDto> {
    const {
      name,
      universityId,
      facultyId,
      department,
      minRating,
      maxRating,
      minReviews,
      page = 1,
      limit = 20,
    } = searchDto;

    // Convertir parámetros a sus tipos correctos
    const parsedPage = Number(page);
    const parsedLimit = Number(limit);
    const parsedUniversityId = universityId ? Number(universityId) : undefined;
    const parsedFacultyId = facultyId ? Number(facultyId) : undefined;
    const parsedMinRating =
      minRating !== undefined ? Number(minRating) : undefined;
    const parsedMaxRating =
      maxRating !== undefined ? Number(maxRating) : undefined;
    const parsedMinReviews =
      minReviews !== undefined ? Number(minReviews) : undefined;

    // Construir el filtro base
    const where: Prisma.ProfessorWhereInput = {};

    // Filtrar por nombre si se proporciona
    if (name) {
      where.fullName = {
        contains: name,
        mode: 'insensitive', // Búsqueda insensible a mayúsculas/minúsculas
      };
    }

    // Filtrar por calificación promedio
    if (parsedMinRating !== undefined || parsedMaxRating !== undefined) {
      where.averageRating = {};
      if (parsedMinRating !== undefined) {
        where.averageRating.gte = parsedMinRating;
      }
      if (parsedMaxRating !== undefined) {
        where.averageRating.lte = parsedMaxRating;
      }
    }

    // Filtrar por número mínimo de reseñas
    if (parsedMinReviews !== undefined) {
      where.reviewCount = {
        gte: parsedMinReviews,
      };
    }

    // Filtros para relaciones
    const universityFilter = parsedUniversityId
      ? {
          some: {
            universityId: parsedUniversityId,
          },
        }
      : undefined;

    const facultyFilter = parsedFacultyId
      ? {
          some: {
            facultyId: parsedFacultyId,
          },
        }
      : undefined;

    // Filtro por departamento (a través de la universidad)
    const departmentFilter = department
      ? {
          some: {
            university: {
              department: {
                contains: department,
                mode: 'insensitive',
              },
            },
          },
        }
      : undefined;

    // Aplicar filtros de relaciones si están definidos
    if (universityFilter) {
      where.universities = universityFilter;
    }

    if (facultyFilter) {
      where.faculties = facultyFilter;
    }

    // Para el filtro de departamento, usamos any para evitar problemas de tipado
    // ya que Prisma tiene tipos complejos para las relaciones anidadas
    if (departmentFilter) {
      where.universities =
        departmentFilter as Prisma.ProfessorUniversityListRelationFilter;
    }

    // Calcular paginación
    const skip = (parsedPage - 1) * parsedLimit;

    // Contar total de registros que coinciden con el filtro
    const total = await this.prisma.professor.count({ where });

    // Obtener profesores con sus relaciones
    const professors = await this.prisma.professor.findMany({
      where,
      skip,
      take: parsedLimit,
      include: {
        universities: {
          include: {
            university: true,
          },
        },
        faculties: {
          include: {
            faculty: true,
          },
        },
      },
      orderBy: {
        averageRating: 'desc', // Ordenar por calificación más alta por defecto
      },
    });

    // Transformar los datos para la respuesta
    const data = professors.map((professor) =>
      this.mapToProfessorResponse(
        professor as unknown as ProfessorWithRelations,
      ),
    );

    // Calcular el último número de página
    const lastPage = Math.ceil(total / parsedLimit);

    return {
      data,
      meta: {
        total,
        page: parsedPage,
        lastPage,
        limit: parsedLimit,
      },
    };
  }

  async findOne(id: number): Promise<ProfessorDetailResponseDto> {
    // Asegurarse de que el ID sea un número
    const parsedId = Number(id);

    const professor = await this.prisma.professor.findUnique({
      where: { id: parsedId },
      include: {
        universities: {
          include: {
            university: true,
          },
        },
        faculties: {
          include: {
            faculty: true,
          },
        },
        courses: {
          include: {
            course: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        reviews: {
          include: {
            course: true,
          },
          where: {
            visibilityStatus: 'visible', // Solo mostrar reseñas visibles
          },
          orderBy: {
            createdAt: 'desc', // Ordenar por más recientes primero
          },
        },
      },
    });

    if (!professor) {
      throw new NotFoundException(`Profesor con ID ${parsedId} no encontrado`);
    }

    return this.mapToProfessorDetailResponse(
      professor as unknown as ProfessorWithRelations,
    );
  }

  // Método auxiliar para mapear un profesor a su DTO de respuesta
  private mapToProfessorResponse(
    professor: ProfessorWithRelations,
  ): ProfessorResponseDto {
    return {
      id: professor.id,
      fullName: professor.fullName,
      averageRating: professor.averageRating,
      reviewCount: professor.reviewCount,
      universities: professor.universities.map((rel: UniversityRelation) => ({
        id: rel.university.id,
        name: rel.university.name,
        acronym: rel.university.acronym,
      })),
      faculties: professor.faculties.map((rel: FacultyRelation) => ({
        id: rel.faculty.id,
        name: rel.faculty.name,
      })),
    };
  }

  // Método auxiliar para mapear un profesor a su DTO de respuesta detallada
  private mapToProfessorDetailResponse(
    professor: ProfessorWithRelations,
  ): ProfessorDetailResponseDto {
    return {
      id: professor.id,
      fullName: professor.fullName,
      averageRating: professor.averageRating,
      reviewCount: professor.reviewCount,
      universities: professor.universities.map((rel: UniversityRelation) => ({
        id: rel.university.id,
        name: rel.university.name,
        acronym: rel.university.acronym,
      })),
      faculties: professor.faculties.map((rel: FacultyRelation) => ({
        id: rel.faculty.id,
        name: rel.faculty.name,
      })),
      courses: (professor.courses || []).map((rel: CourseRelation) => ({
        id: rel.course.id,
        name: rel.course.name,
      })),
      tags: (professor.tags || []).map((rel: TagRelation) => ({
        id: rel.tag.id,
        name: rel.tag.name,
        type: rel.tag.type,
      })),
      reviews: (professor.reviews || []).map((review: ReviewWithCourse) => ({
        id: review.id,
        overallRating: review.overallRating,
        teachingQuality: review.teachingQuality,
        difficultyLevel: review.difficultyLevel,
        mandatoryAttendance: review.mandatoryAttendance,
        classInterest: review.classInterest,
        detailedComment: review.detailedComment,
        gradeObtained: review.gradeObtained,
        createdAt: review.createdAt,
        course: {
          id: review.course.id,
          name: review.course.name,
        },
      })),
    };
  }
}
