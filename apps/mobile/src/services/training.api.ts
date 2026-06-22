import { apiClient } from './api-client';

export interface TodayWorkoutExercise {
  exerciseId: string;
  name?: string;
  setsTarget: number;
  repsTarget: number;
}

export interface TodayWorkout {
  has_workout_today: boolean;
  completed_today: boolean;
  workout_day: { dayLabel?: string; exercises?: TodayWorkoutExercise[] } | null;
}

export const trainingApi = {
  async getToday(): Promise<TodayWorkout> {
    const { data } = await apiClient.get('/training/today');
    return data.data;
  },

  async startSession(workoutDayId: string) {
    const { data } = await apiClient.post('/training/sessions', { workout_day_id: workoutDayId });
    return data.data;
  },

  async logSet(sessionId: string, payload: { exercise_id: string; set_number: number; reps_completed: number; subjective_fatigue?: number }) {
    const { data } = await apiClient.post(`/training/sessions/${sessionId}/logs`, payload);
    return data.data;
  },

  async completeSession(sessionId: string, payload: { subjective_fatigue: number }) {
    const { data } = await apiClient.patch(`/training/sessions/${sessionId}/complete`, payload);
    return data.data;
  },
};
