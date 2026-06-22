import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, typography } from '../theme/tokens';
import { nutritionApi, NutritionTargets, DiaryToday } from '../services/nutrition.api';
import { CaliButton } from '../components/CaliButton';
import { CaliTextInput } from '../components/CaliTextInput';

/**
 * TAB 3 — Nutrición (UXUI.md §3.1). v1: targets del día + registro manual de
 * macros. Food Search/Barcode Scanner/Photo Estimate/Meal Planner (API.md §6,
 * UXUI.md) quedan para v1.1 — requieren integraciones que exceden esta entrega.
 */
export function NutritionScreen() {
  const [targets, setTargets] = useState<NutritionTargets | null>(null);
  const [diary, setDiary] = useState<DiaryToday | null>(null);
  const [description, setDescription] = useState('');
  const [calories, setCalories] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [t, d] = await Promise.all([nutritionApi.getTargets().catch(() => null), nutritionApi.getDiaryToday()]);
      setTargets(t);
      setDiary(d);
    } catch {
      setError('No se pudo cargar el diario de hoy.');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleLog = async () => {
    if (!description || !calories) return;
    setBusy(true);
    try {
      await nutritionApi.logFood({
        meal_type: 'snack',
        description,
        calories_kcal: Number(calories),
        protein_g: 0,
        carbs_g: 0,
        fat_g: 0,
      });
      setDescription('');
      setCalories('');
      await load();
    } catch {
      setError('No se pudo registrar el alimento.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Nutrición</Text>
      {error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Hoy</Text>
        <Text style={styles.metric}>
          {Math.round(diary?.summary.calories_kcal ?? 0)} kcal
          {targets ? ` / ${targets.calories_kcal} kcal` : ''}
        </Text>
        <Text style={styles.bodyText}>
          P {Math.round(diary?.summary.protein_g ?? 0)}g · C {Math.round(diary?.summary.carbs_g ?? 0)}g · G{' '}
          {Math.round(diary?.summary.fat_g ?? 0)}g
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Registrar alimento</Text>
        <CaliTextInput label="Descripción" value={description} onChangeText={setDescription} placeholder="Ej: pollo con arroz" />
        <CaliTextInput label="Calorías (kcal)" value={calories} onChangeText={setCalories} keyboardType="numeric" placeholder="0" />
        <CaliButton label="Agregar" onPress={handleLog} loading={busy} disabled={!description || !calories} />
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
  cardTitle: { ...typography.caption, color: colors.textSecondary, textTransform: 'uppercase' },
  metric: { ...typography.h2, color: colors.lime500 },
});
