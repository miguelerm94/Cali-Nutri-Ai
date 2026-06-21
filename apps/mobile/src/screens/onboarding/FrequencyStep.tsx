import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OnboardingProgress } from '../../components/OnboardingProgress';
import { SelectableCard } from '../../components/SelectableCard';
import { CaliButton } from '../../components/CaliButton';
import { colors, spacing, typography } from '../../theme/tokens';
import { useOnboardingStore } from '../../store/onboarding.store';
import { OnboardingStackParamList } from '../../navigation/OnboardingNavigator';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Frequency'>;

/** Onboarding paso 5: frecuencia semanal — determina la estructura de rutina (FD-03). */
const FREQUENCIES = [
  { days: 3, structure: 'Full Body (A/B/A)', note: 'Ideal para empezar — recuperación amplia entre sesiones.' },
  { days: 4, structure: 'Upper / Lower', note: 'Más volumen por grupo muscular.' },
  { days: 5, structure: 'Push / Pull / Legs + 2 complementarios', note: 'Para quienes ya entrenan con frecuencia.' },
  { days: 6, structure: 'Push / Pull / Legs × 2', note: 'Alto volumen — recomendado en nivel avanzado.' },
];

export function FrequencyStep({ navigation }: Props) {
  const { data, updateData, setStep } = useOnboardingStore();
  const [frequency, setFrequency] = useState<number | undefined>(data.training_frequency);

  const onNext = () => {
    updateData({ training_frequency: frequency ?? 3 });
    setStep(6);
    navigation.navigate('Assessment');
  };

  return (
    <View style={styles.container}>
      <OnboardingProgress currentStep={5} />
      <Text style={styles.title}>¿Cuántos días por semana?</Text>
      <Text style={styles.subtitle}>
        Tu rutina se genera automáticamente según tu frecuencia y nivel real — sin que tengas que elegir el split.
      </Text>

      {FREQUENCIES.map((f) => (
        <SelectableCard
          key={f.days}
          title={`${f.days} días/semana — ${f.structure}`}
          description={f.note}
          selected={frequency === f.days}
          onPress={() => setFrequency(f.days)}
        />
      ))}

      <CaliButton label="Continuar" onPress={onNext} disabled={!frequency} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundBase, padding: spacing.sp6, paddingTop: spacing.sp16 },
  title: { ...typography.displayM, color: colors.textPrimary },
  subtitle: { ...typography.bodyM, color: colors.textSecondary, marginTop: spacing.sp2, marginBottom: spacing.sp8 },
});
