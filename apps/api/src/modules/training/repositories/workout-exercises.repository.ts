import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

@Injectable()
export class WorkoutExercisesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.workoutExercise.findUnique({ where: { id } });
  }

  /** FD-04: progresión automática — incrementa 1 rep por serie sobre la prescripción vigente. */
  incrementRepsTarget(id: string, increment = 1) {
    return this.prisma.workoutExercise.update({
      where: { id },
      data: { repsTarget: { increment } },
    });
  }
}
