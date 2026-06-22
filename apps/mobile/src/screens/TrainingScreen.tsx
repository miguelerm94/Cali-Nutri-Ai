import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, typography } from '../theme/tokens';
import { trainingApi, TodayWorkout, TodayWorkoutExercise } from '../services/training.api';
import { CaliButton } from '../components/CaliButton';

/**
 * TAB 2 — Entrenamiento (UXUI.md §3.1). v1: muestra el día de hoy y permite
 * iniciar/completar la sesión. Exercise Library, Rest Timer, Session Summary
 * y Movement History (pantallas anidadas de API.md/UXUI.md) quedan para v1.1
 * — esta entrega cubre el flujo mínimo de "ver y registrar el entreno de hoy".
 */
export function TrainingScreen() {
  const [today, setToday] = useState<TodayWorkout | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setToday(await trainingApi.getToday());
    } catch {
      setError('No se pudo cargar el entrenamiento de hoy.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleStart = async () => {
    if (!today?.workout_day) return;
    setBusy(true);
    try {
      const session = await trainingApi.startSession((today.workout_day as { id?: string }).id ?? '');
      setSessionId(session.id);
    } catch {
      setError('No se pudo iniciar la sesión.');
    } finally {
      setBusy(false);
    }
  };

  const handleComplete = async () => {
    if (!sessionId) return;
    setBusy(true);
    try {
      await trainingApi.completeSession(sessionId, { subjective_fatigue: 5 });
      setSessionId(null);
      await load();
    } catch {
      setError('No se pudo completar la sesión.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Entrenamiento</Text>
      {error && <Text style={styles.error}>{error}</Text>}
      {loading && <Text style={styles.bodyText}>Cargando...</Text>}

      {!loading && today && !today.has_workout_today && (
        <Text style={styles.bodyText}>Hoy es día de descanso 🧘</Text>
      )}

      {!loading && today?.has_workout_today && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{today.workout_day?.dayLabel ?? 'Sesión de hoy'}</Text>
          {today.workout_day?.exercises?.map((exercise: TodayWorkoutExercise) => (
            <Text key={exercise.exerciseId} style={styles.bodyText}>
              • {exercise.name ?? exercise.exerciseId} — {exercise.setsTarget}x{exercise.repsTarget}
            </Text>
          ))}

          {today.completed_today ? (
            <Text style={styles.bodyText}>Completado ✅</Text>
          ) : sessionId ? (
            <CaliButton label="Completar sesión" onPress={handleComplete} loading={busy} />
          ) : (
            <CaliButton label="Iniciar sesión" onPress={handleStart} loading={busy} />
          )}
        </View>
      )}
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
  cardTitle: { ...typography.h2, color: colors.lime500 },
});
