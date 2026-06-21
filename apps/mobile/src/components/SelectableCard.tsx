import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, typography } from '../theme/tokens';

interface Props {
  title: string;
  description?: string;
  selected: boolean;
  onPress: () => void;
}

/** Card seleccionable — UXUI.md §12: borde Lime 1.5px + fondo Lime ghost cuando está seleccionada. */
export function SelectableCard({ title, description, selected, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      style={[styles.card, selected && styles.cardSelected]}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{title}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
      </View>
      <View style={[styles.radio, selected && styles.radioSelected]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface200,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: spacing.sp4,
    marginBottom: spacing.sp3,
  },
  cardSelected: { borderWidth: 1.5, borderColor: colors.lime500, backgroundColor: colors.lime100 },
  title: { ...typography.h3, color: colors.textPrimary },
  description: { ...typography.bodyS, color: colors.textSecondary, marginTop: 2 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: colors.borderSubtle },
  radioSelected: { borderColor: colors.lime500, backgroundColor: colors.lime500 },
});
