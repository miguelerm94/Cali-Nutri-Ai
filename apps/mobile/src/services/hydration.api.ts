import { apiClient } from './api-client';

export interface HydrationToday {
  consumed_ml: number;
  target_ml: number;
  remaining_ml: number;
  percent_completed: number;
  status: string;
}

export const hydrationApi = {
  async getToday(): Promise<HydrationToday> {
    const { data } = await apiClient.get('/hydration/today');
    return data.data;
  },

  async logWater(amountMl: number) {
    const { data } = await apiClient.post('/hydration/logs', { amount_ml: amountMl });
    return data.data;
  },
};
