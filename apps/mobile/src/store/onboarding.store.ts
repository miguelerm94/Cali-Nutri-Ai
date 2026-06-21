import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV({ id: 'cali-onboarding' });

/** Adaptador MMKV para zustand/persist (no usar localStorage/AsyncStorage). */
const mmkvStorage = {
  getItem: (name: string) => storage.getString(name) ?? null,
  setItem: (name: string, value: string) => storage.set(name, value),
  removeItem: (name: string) => storage.delete(name),
};

export interface OnboardingFormData {
  birth_date?: string;
  sex?: 'male' | 'female';
  height_cm?: number;
  weight_kg?: number;
  target_weight_kg?: number;
  unit_preference: 'metric' | 'imperial';
  goal_type?: 'muscle_gain' | 'fat_loss' | 'recomposition' | 'maintenance';
  training_frequency?: number;
  movement_tests?: {
    pull_ups_max: number;
    push_ups_max: number;
    squats_max: number;
    plank_seconds: number;
    dips_max?: number;
  };
}

interface OnboardingState {
  currentStep: number; // 2-6, espejo de users.onboarding_step (FD-ARCH-07)
  data: OnboardingFormData;
  setStep: (step: number) => void;
  updateData: (partial: Partial<OnboardingFormData>) => void;
  reset: () => void;
}

/**
 * Persistido en MMKV — A-08 Onboarding state machine. Si el usuario abandona
 * en el paso 3 y reabre la app, retoma desde el paso 3 (Audit_report.md checklist).
 */
export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      currentStep: 2,
      data: { unit_preference: 'metric' },
      setStep: (step) => set({ currentStep: step }),
      updateData: (partial) => set((state) => ({ data: { ...state.data, ...partial } })),
      reset: () => set({ currentStep: 2, data: { unit_preference: 'metric' } }),
    }),
    { name: 'onboarding-wizard', storage: createJSONStorage(() => mmkvStorage) },
  ),
);
