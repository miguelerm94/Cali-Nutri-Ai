import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CaliButton } from '../../components/CaliButton';
import { colors, radii, spacing, typography } from '../../theme/tokens';
import { useOnboardingStore } from '../../store/onboarding.store';
import { useAuthStore } from '../../store/auth.store';
import { assessmentApi, AssessmentResult } from '../../services/assessment.api';
import { getApiErrorMessage } from '../../services/api-client';
import { OnboardingStackParamList } from '../../navigation/OnboardingNavigator';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Results'>;

const LEVEL_LABEL: Record<string, string> = { beginner: 'Principiante', intermediate: 'Intermedio', advanced: 'Avanzado' };

/** Onboarding paso 7: envía todo a POST /assessment/initial y muestra el resultado. */
export function ResultsStep(_: Props) {
  const { data, reset } = useOnboardingStore();
  const updateUser = useAuthStore((s) => s.updateUser);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AssessmentResult | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const response = await assessmentApi.completeInitial(data as any);
        setResult(response);
      } catch (err) {
        setError(getApiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleContinue = () => {
    reset();
    // Solo parchea el flag en memoria — NO toca accessToken/refreshToken.
    updateUser({ onboarding_completed: true });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.lime500} size="large" />
        <Text style={styles.loadingText}>Calculando tu nivel y generando tu rutina...</Text>
      </View>
    );
  }

  if (error || !result) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>No pudimos completar tu evaluación</Text>
        <Text style={styles.subtitle}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.title}>Tu plan está listo</Text>
      <Text style={styles.subtitle}>Nivel {LEVEL_LABEL[result.presentation_level]} · Score global {result.global_score}/100</Text>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>RUTINA ASIGNADA</Text>
        <Text style={styles.cardValue}>{result.training_program.name}</Text>
        <Text style={styles.cardSub}>
          {result.training_program.weekly_frequency} días/semana · {result.training_program.days.length} días generados
        </Text>
        {result.training_program.days.map((d, i) => (
          <Text key={i} style={styles.dayLine}>
            • {d.day_name} — {d.exercises_count} ejercicios
          </Text>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>OBJETIVO NUTRICIONAL</Text>
        <Text style={styles.cardValue}>{result.goal.target_calories} kcal/día</Text>
        <View style={styles.macrosRow}>
          <Text style={styles.macro}>P {result.goal.target_protein_g}g</Text>
          <Text style={styles.macro}>C {result.goal.target_carbs_g}g</Text>
          <Text style={styles.macro}>G {result.goal.target_fat_g}g</Text>
        </View>
        <Text style={styles.cardSub}>TDEE estimado: {result.goal.tdee} kcal</Text>
      </View>

      <CaliButton label="Empezar a entrenar" onPress={handleContinue} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: colors.backgroundBase, justifyContent: 'center', alignItems: 'center', padding: spacing.sp6, gap: spacing.sp4 },
  scroll: { backgroundColor: colors.backgroundBase, padding: spacing.sp6, paddingTop: spacing.sp16, paddingBottom: spacing.sp10, gap: spacing.sp4 },
  title: { ...typography.displayM, color: colors.textPrimary },
  subtitle: { ...typography.bodyM, color: colors.textSecondary, marginTop: spacing.sp2, marginBottom: spacing.sp6 },
  errorTitle: { ...typography.h1, color: colors.error, textAlign: 'center' },
  loadingText: { ...typography.bodyM, color: colors.textSecondary, textAlign: 'center' },
  card: { backgroundColor: colors.surface200, borderRadius: radii.lg, padding: spacing.sp4, marginBottom: spacing.sp4 },
  cardLabel: { ...typography.caption, color: colors.lime500, marginBottom: spacing.sp2 },
  cardValue: { ...typography.displayM, color: colors.textPrimary },
  cardSub: { ...typography.bodyS, color: colors.textSecondary, marginTop: spacing.sp1 },
  dayLine: { ...typography.bodyM, color: colors.textPrimary, marginTop: spacing.sp2 },
  macrosRow: { flexDirection: 'row', gap: spacing.sp4, marginTop: spacing.sp2 },
  macro: { ...typography.monoL, color: colors.mint500 },
});
