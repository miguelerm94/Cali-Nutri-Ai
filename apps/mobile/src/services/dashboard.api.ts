import { apiClient } from './api-client';

export interface DashboardSummary {
  date: string;
  training: {
    has_workout_today: boolean;
    workout_completed: boolean;
    workout: unknown;
    streak_days: number;
  };
  nutrition: {
    summary: { calories_kcal: number; protein_g: number; carbs_g: number; fat_g: number };
    meals_logged: number;
    targets: { calories_kcal: number; protein_g: number; carbs_g: number; fat_g: number } | null;
  };
  hydration: {
    consumed_ml: number;
    target_ml: number;
    remaining_ml: number;
    percent: number;
    status: string;
  } | null;
  body: { last_weight_kg: number; last_measured_at: string; days_since_last_measurement: number } | null;
}

export const dashboardApi = {
  async getSummary(): Promise<DashboardSummary> {
    const { data } = await apiClient.get('/dashboard/summary');
    return data.data;
  },
};
