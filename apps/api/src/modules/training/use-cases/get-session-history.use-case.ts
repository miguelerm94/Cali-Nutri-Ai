import { Injectable } from '@nestjs/common';
import { WorkoutSessionsRepository } from '../repositories/workout-sessions.repository';
import { SessionsHistoryQueryDto } from '../dto/sessions-history-query.dto';

/** GET /training/sessions — historial paginado (API.md §5). */
@Injectable()
export class GetSessionHistoryUseCase {
  constructor(private readonly sessionsRepository: WorkoutSessionsRepository) {}

  async execute(userId: string, query: SessionsHistoryQueryDto) {
    const to = query.to ? new Date(query.to) : new Date();
    const from = query.from ? new Date(query.from) : new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);

    const sessions = await this.sessionsRepository.findHistoryByUser(userId, {
      from,
      to,
      limit: query.limit,
      cursor: query.cursor,
    });

    return {
      sessions: sessions.map((s) => ({
        id: s.id,
        day_name: s.workoutDay?.dayName ?? null,
        day_type: s.workoutDay?.dayType ?? null,
        started_at: s.startedAt,
        finished_at: s.finishedAt,
        duration_minutes: s.durationMinutes,
        total_reps: s.workoutLogs.reduce((sum, log) => sum + log.repsCompleted, 0),
        sets_completed: s.workoutLogs.length,
      })),
      pagination: {
        has_next: sessions.length === query.limit,
        next_cursor: sessions.length > 0 ? sessions[sessions.length - 1].id : null,
      },
    };
  }
}
