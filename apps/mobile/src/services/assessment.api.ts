import { apiClient } from './api-client';
import { OnboardingFormData } from '../store/onboarding.store';

export interface AssessmentResult {
  presentation_level: 'beginner' | 'intermediate' | 'advanced';
  global_score: number;
  scores: { pullups: number; pushups: number; squats: number; core: number };
  goal: { type: string; tdee: number; target_calories: number; target_protein_g: number; target_carbs_g: number; target_fat_g: number };
  training_program: {
    id: string;
    name: string;
    structure: string;
    weekly_frequency: number;
    days: Array<{ day_name: string; day_type: string; exercises_count: number }>;
  };
}

export const assessmentApi = {
  async completeInitial(data: Required<Omit<OnboardingFormData, 'target_weight_kg'>> & { target_weight_kg?: number }): Promise<AssessmentResult> {
    const { data: response } = await apiClient.post('/assessment/initial', data);
    return response.data;
  },
};
