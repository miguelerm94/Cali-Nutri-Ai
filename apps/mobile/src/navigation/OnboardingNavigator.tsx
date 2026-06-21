import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BirthSexStep } from '../screens/onboarding/BirthSexStep';
import { BiometricsStep } from '../screens/onboarding/BiometricsStep';
import { GoalStep } from '../screens/onboarding/GoalStep';
import { FrequencyStep } from '../screens/onboarding/FrequencyStep';
import { AssessmentStep } from '../screens/onboarding/AssessmentStep';
import { ResultsStep } from '../screens/onboarding/ResultsStep';
import { useOnboardingStore } from '../store/onboarding.store';

export type OnboardingStackParamList = {
  BirthSex: undefined;
  Biometrics: undefined;
  Goal: undefined;
  Frequency: undefined;
  Assessment: undefined;
  Results: undefined;
};

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

const STEP_TO_SCREEN: Record<number, keyof OnboardingStackParamList> = {
  2: 'BirthSex',
  3: 'Biometrics',
  4: 'Goal',
  5: 'Frequency',
  6: 'Assessment',
};

/**
 * A-08 — Onboarding state machine. El wizard retoma en el paso donde el
 * usuario lo dejó (persistido en MMKV vía useOnboardingStore).
 */
export function OnboardingNavigator() {
  const currentStep = useOnboardingStore((s) => s.currentStep);
  const initialRouteName = STEP_TO_SCREEN[currentStep] ?? 'BirthSex';

  return (
    <Stack.Navigator initialRouteName={initialRouteName} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="BirthSex" component={BirthSexStep} />
      <Stack.Screen name="Biometrics" component={BiometricsStep} />
      <Stack.Screen name="Goal" component={GoalStep} />
      <Stack.Screen name="Frequency" component={FrequencyStep} />
      <Stack.Screen name="Assessment" component={AssessmentStep} />
      <Stack.Screen name="Results" component={ResultsStep} />
    </Stack.Navigator>
  );
}
