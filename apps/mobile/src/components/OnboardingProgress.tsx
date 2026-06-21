import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, spacing } from '../theme/tokens';

interface Props {
  currentStep: number; // 2-6
  totalSteps?: number;
}

/** Indicador de progreso del wizard — UXUI.md "Paso X de 6" (puntos ●○). */
export function OnboardingProgress({ currentStep, totalSteps = 6 }: Props) {
  const adjustedStep = currentStep - 1; // step 2 → posición 1 de 6
  return (
    <View style={styles.row}>
      {Array.from({ length: totalSteps }).map((_, i) => (
        <View key={i} style={[styles.dot, i < adjustedStep ? styles.dotDone : styles.dotPending]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sp2, marginBottom: spacing.sp6 },
  dot: { flex: 1, height: 4, borderRadius: 2 },
  dotDone: { backgroundColor: colors.lime500 },
  dotPending: { backgroundColor: colors.borderSubtle },
});
