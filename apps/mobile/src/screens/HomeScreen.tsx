import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CaliButton } from '../components/CaliButton';
import { colors, spacing, typography } from '../theme/tokens';
import { useAuthStore } from '../store/auth.store';
import { authApi } from '../services/auth.api';

/**
 * Placeholder post-login. El Dashboard real (5 tabs: Dashboard/Training/
 * Nutrition/Hydration/AI — UXUI.md §3) se construye a partir de S2-S5b,
 * cuando existan los módulos de dominio correspondientes.
 */
export function HomeScreen() {
  const { user, clearSession } = useAuthStore();

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } finally {
      await clearSession();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>Hola, {user?.first_name} 👋</Text>
      <Text style={styles.note}>
        S1 — Fundación completa. El Dashboard, entrenamiento, nutrición e hidratación llegan en
        los próximos sprints (S2-S5a).
      </Text>
      <CaliButton label="Cerrar sesión" variant="secondary" onPress={handleLogout} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundBase,
    padding: spacing.sp6,
    justifyContent: 'center',
    gap: spacing.sp4,
  },
  greeting: { ...typography.displayM, color: colors.textPrimary },
  note: { ...typography.bodyM, color: colors.textSecondary },
});
