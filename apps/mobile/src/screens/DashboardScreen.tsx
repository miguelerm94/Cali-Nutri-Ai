import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, typography } from '../theme/tokens';
import { useAuthStore } from '../store/auth.store';
import { authApi } from '../services/auth.api';
import { dashboardApi, DashboardSummary } from '../services/dashboard.api';
import { CaliButton } from '../components/CaliButton';

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

/** TAB 1 — Dashboard/Home (UXUI.md §3.1): agrega training/nutrition/hydration/body. */
export function DashboardScreen() {
  const { user, clearSession } = useAuthStore();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setSummary(await dashboardApi.getSummary());
    } catch {
      setError('No se pudo cargar el resumen del día.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } finally {
      await clearSession();
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.lime500} />}
    >
      <Text style={styles.greeting}>Hola, {user?.first_name} 👋</Text>
      {error && <Text style={styles.error}>{error}</Text>}

      {summary && (
        <>
          <Card title="Entrenamiento de hoy">
            <Text style={styles.bodyText}>
              {summary.training.has_workout_today
                ? summary.training.workout_completed
                  ? 'Completado ✅'
                  : 'Pendiente — tenés sesión hoy'
                : 'Día de descanso'}
            </Text>
            <Text style={styles.metric}>🔥 Racha: {summary.training.streak_days} días</Text>
          </Card>

          <Card title="Nutrición">
            <Text style={styles.metric}>
              {Math.round(summary.nutrition.summary.calories_kcal)} kcal
              {summary.nutrition.targets ? ` / ${summary.nutrition.targets.calories_kcal} kcal` : ''}
            </Text>
            <Text style={styles.bodyText}>{summary.nutrition.meals_logged} comidas registradas</Text>
          </Card>

          {summary.hydration && (
            <Card title="Hidratación">
              <Text style={styles.metric}>
                {summary.hydration.consumed_ml} ml / {summary.hydration.target_ml} ml
              </Text>
              <Text style={styles.bodyText}>{summary.hydration.percent}% completado</Text>
            </Card>
          )}

          {summary.body && (
            <Card title="Peso corporal">
              <Text style={styles.metric}>{summary.body.last_weight_kg} kg</Text>
              <Text style={styles.bodyText}>hace {summary.body.days_since_last_measurement} días</Text>
            </Card>
          )}
        </>
      )}

      <CaliButton label="Cerrar sesión" variant="secondary" onPress={handleLogout} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundBase },
  content: { padding: spacing.sp6, gap: spacing.sp4 },
  greeting: { ...typography.displayM, color: colors.textPrimary, marginBottom: spacing.sp2 },
  error: { ...typography.bodyM, color: colors.error },
  card: { backgroundColor: colors.surface100, borderRadius: radii.lg, padding: spacing.sp4, gap: spacing.sp1, borderWidth: 1, borderColor: colors.borderSubtle },
  cardTitle: { ...typography.caption, color: colors.textSecondary, textTransform: 'uppercase' },
  metric: { ...typography.h2, color: colors.lime500 },
  bodyText: { ...typography.bodyM, color: colors.textPrimary },
});
