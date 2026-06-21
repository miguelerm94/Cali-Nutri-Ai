import { Injectable } from '@nestjs/common';
import { ExerciseCategory } from '@prisma/client';
import { ExercisesRepository } from '../repositories/exercises.repository';
import { ExercisesQueryDto } from '../dto/sessions-history-query.dto';

/** GET /training/exercises — catálogo con filtros (API.md §5). */
@Injectable()
export class GetExercisesUseCase {
  constructor(private readonly exercisesRepository: ExercisesRepository) {}

  async execute(query: ExercisesQueryDto) {
    const exercises = await this.exercisesRepository.findFiltered({
      category: query.category as ExerciseCategory | undefined,
      difficulty: query.difficulty,
      search: query.search,
      limit: query.limit,
    });

    return {
      exercises: exercises.map((ex) => ({
        id: ex.id,
        name: ex.name,
        name_es: ex.nameEs,
        category: ex.category,
        difficulty: ex.difficulty,
        primary_muscle: ex.primaryMuscle,
        secondary_muscles: ex.secondaryMuscles,
        description: ex.description,
        video_url: ex.videoUrl,
        image_url: ex.imageUrl,
      })),
    };
  }
}
