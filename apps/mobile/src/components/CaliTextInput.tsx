import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { colors, radii, spacing, typography } from '../theme/tokens';

interface CaliTextInputProps extends TextInputProps {
  label: string;
  error?: string;
}

/** Input de formulario — UXUI.md §12, Surface 200 con borde de error en rojo semántico. */
export function CaliTextInput({ label, error, style, ...rest }: CaliTextInputProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, error ? styles.inputError : null, style]}
        placeholderTextColor={colors.textSecondary}
        accessibilityLabel={label}
        {...rest}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.sp4 },
  label: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.sp2 },
  input: {
    backgroundColor: colors.surface200,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    paddingHorizontal: spacing.sp4,
    paddingVertical: spacing.sp3,
    color: colors.textPrimary,
    ...typography.bodyL,
  },
  inputError: { borderColor: colors.error },
  error: { ...typography.bodyS, color: colors.error, marginTop: spacing.sp2 },
});
