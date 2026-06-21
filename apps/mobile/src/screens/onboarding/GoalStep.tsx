import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OnboardingProgress } from '../../components/OnboardingProgress';
import { SelectableCard } from '../../components/SelectableCard';
import { CaliButton } from '../../components/CaliButton';
import { colors, spacing, typography } from '../../theme/tokens';
import { useOnboardingStore, OnboardingFormData } from '../../store/onboarding.store';
import { OnboardingStackParamList } from '../../navigation/OnboardingNavigator';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Goal'>;
type GoalType = NonNullable<OnboardingFormData['goal_type']>;

/** Onboarding paso 4: objetivo (FD-06 — determina el ajuste calórico sobre TDEE). */
const GOALS: Array<{ type: GoalType; title: string; description: string }> = [
  { type: 'muscle_gain', title: 'Ganancia muscular', description: 'Superávit calórico controlado (+300 kcal sobre tu TDEE).' },
  { type: 'fat_loss', title: 'Pérdida de grasa', description: 'Déficit moderado que preserva masa muscular (-400 kcal).' },
  { type: 'recomposition', title: 'Recomposición corporal', description: 'Mejorar tu relación músculo-grasa (-150 kcal, alta proteína).' },
  { type: 'maintenance', title: 'Mantenimiento', description: 'Mantener tu peso y rendimiento actual (TDEE exacto).' },
];

export function GoalStep({ navigation }: Props) {
  const { data, updateData, setStep } = useOnboardingStore();
  const [goalType, setGoalType] = useState<GoalType | undefined>(data.goal_type);

  const onNext = () => {
    if (!goalType) {
      Alert.alert('Elige un objetivo', 'Selecciona el objetivo que mejor describe tu meta actual.');
      return;
    }
    updateData({ goal_type: goalType });
    setStep(5);
    navigation.navigate('Frequency');
  };

  return (
    <View style={styles.container}>
      <OnboardingProgress currentStep={4} />
      <Text style={styles.title}>¿Cuál es tu objetivo?</Text>
      <Text style={styles.subtitle}>CALI ajustará tus calorías y macros según esta elección.</Text>

      {GOALS.map((g) => (
        <SelectableCard
          key={g.type}
          title={g.title}
          description={g.description}
          selected={goalType === g.type}
          onPress={() => setGoalType(g.type)}
        />
      ))}

      <CaliButton label="Continuar" onPress={onNext} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundBase, padding: spacing.sp6, paddingTop: spacing.sp16 },
  title: { ...typography.displayM, color: colors.textPrimary },
  subtitle: { ...typography.bodyM, color: colors.textSecondary, marginTop: spacing.sp2, marginBottom: spacing.sp8 },
});
