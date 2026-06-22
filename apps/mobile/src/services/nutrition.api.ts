import { apiClient } from './api-client';

export interface NutritionTargets {
  calories_kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface DiaryToday {
  summary: NutritionTargets;
  by_meal: Record<string, NutritionTargets>;
}

export const nutritionApi = {
  async getTargets(): Promise<NutritionTargets> {
    const { data } = await apiClient.get('/nutrition/targets');
    return data.data;
  },

  async getDiaryToday(): Promise<DiaryToday> {
    const { data } = await apiClient.get('/nutrition/diary/today');
    return data.data;
  },

  async logFood(payload: { meal_type: string; description: string; calories_kcal: number; protein_g: number; carbs_g: number; fat_g: number }) {
    const { data } = await apiClient.post('/nutrition/diary', payload);
    return data.data;
  },
};
