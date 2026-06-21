import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { colors, minTouchTarget, radii, spacing, typography } from '../theme/tokens';

interface CaliButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  loading?: boolean;
  disabled?: boolean;
}

/** Botón primario — UXUI.md §12 (acción principal en Lime 500, texto inverso). */
export function CaliButton({ label, onPress, variant = 'primary', loading, disabled }: CaliButtonProps) {
  const isPrimary = variant === 'primary';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.base,
        isPrimary ? styles.primary : styles.secondary,
        (disabled || loading) && styles.disabled,
        pressed && !disabled && { opacity: 0.85 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? colors.textInverse : colors.lime500} />
      ) : (
        <Text style={[styles.label, isPrimary ? styles.labelPrimary : styles.labelSecondary]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: minTouchTarget + 8,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sp6,
  },
  primary: { backgroundColor: colors.lime500 },
  secondary: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.borderSubtle },
  disabled: { opacity: 0.5 },
  label: { ...typography.h3 },
  labelPrimary: { color: colors.textInverse },
  labelSecondary: { color: colors.textPrimary },
});
