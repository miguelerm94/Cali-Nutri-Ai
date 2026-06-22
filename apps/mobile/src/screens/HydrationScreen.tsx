import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, typography } from '../theme/tokens';
import { hydrationApi, HydrationToday } from '../services/hydration.api';
import { CaliButton } from '../components/CaliButton';

const QUICK_AMOUNTS_ML = [250, 500, 750];

/** TAB 4 — Hidratación (UXUI.md §3.1). Water Log History/Settings quedan en v1.1. */
export function HydrationScreen() {
  const [today, setToday] = useState<HydrationToday | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setToday(await hydrationApi.getToday());
    } catch {
      setError('No se pudo cargar la hidratación de hoy.');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleLog = async (amountMl: number) => {
    setBusy(true);
    try {
      await hydrationApi.logWater(amountMl);
      await load();
    } catch {
      setError('No se pudo registrar el agua.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Hidratación</Text>
      {error && <Text style={styles.error}>{error}</Text>}

      {today && (
        <View style={styles.card}>
          <Text style={styles.metric}>
            {today.consumed_ml} ml / {today.target_ml} ml
          </Text>
          <Text style={styles.bodyText}>{today.percent_completed}% completado · faltan {today.remaining_ml} ml</Text>
        </View>
      )}

      <View style={styles.row}>
        {QUICK_AMOUNTS_ML.map((ml) => (
          <CaliButton key={ml} label={`+${ml} ml`} variant="secondary" onPress={() => handleLog(ml)} disabled={busy} />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundBase },
  content: { padding: spacing.sp6, gap: spacing.sp4 },
  title: { ...typography.displayM, color: colors.textPrimary },
  error: { ...typography.bodyM, color: colors.error },
  bodyText: { ...typography.bodyM, color: colors.textPrimary },
  card: { backgroundColor: colors.surface100, borderRadius: radii.lg, padding: spacing.sp4, gap: spacing.sp2, borderWidth: 1, borderColor: colors.borderSubtle },
  metric: { ...typography.h2, color: colors.mint500 },
  row: { flexDirection: 'row', gap: spacing.sp2, flexWrap: 'wrap' },
});
