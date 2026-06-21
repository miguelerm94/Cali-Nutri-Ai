import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OnboardingProgress } from '../../components/OnboardingProgress';
import { CaliButton } from '../../components/CaliButton';
import { CaliTextInput } from '../../components/CaliTextInput';
import { colors, spacing, typography } from '../../theme/tokens';
import { useOnboardingStore } from '../../store/onboarding.store';
import { OnboardingStackParamList } from '../../navigation/OnboardingNavigator';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Assessment'>;

/**
 * Onboarding paso 6: evaluación de movimientos (FD-01). Determina fitness_score
 * y la rutina/nivel real del usuario — no la frecuencia, que ya fue elegida.
 */
export function AssessmentStep({ navigation }: Props) {
  const { updateData, setStep } = useOnboardingStore();
  const [pullUps, setPullUps] = useState('');
  const [pushUps, setPushUps] = useState('');
  const [squats, setSquats] = useState('');
  const [plankSeconds, setPlankSeconds] = useState('');
  const [dips, setDips] = useState('');

  const onSubmit = () => {
    const parsed = {
      pull_ups_max: parseInt(pullUps || '0', 10),
      push_ups_max: parseInt(pushUps || '0', 10),
      squats_max: parseInt(squats || '0', 10),
      plank_seconds: parseInt(plankSeconds || '0', 10),
      dips_max: parseInt(dips || '0', 10),
    };
    if ([parsed.push_ups_max, parsed.squats_max, parsed.plank_seconds].some((v) => Number.isNaN(v))) {
      Alert.alert('Revisa tus datos', 'Flexiones, sentadillas y plancha son obligatorios (usa 0 si no puedes hacer ninguna).');
      return;
    }
    updateData({ movement_tests: parsed });
    setStep(7);
    navigation.navigate('Results');
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <OnboardingProgress currentStep={6} />
        <Text style={styles.title}>Evaluación de movimientos</Text>
        <Text style={styles.subtitle}>
          Haz el máximo de repeticiones posible con buena técnica. Para en el fallo técnico — esto define tu punto de partida real, no un ideal.
        </Text>

        <CaliTextInput label="Dominadas (máximo, 0 si no puedes ninguna)" keyboardType="number-pad" value={pullUps} onChangeText={setPullUps} />
        <CaliTextInput label="Flexiones normales (máximo)" keyboardType="number-pad" value={pushUps} onChangeText={setPushUps} />
        <CaliTextInput label="Sentadillas (máximo)" keyboardType="number-pad" value={squats} onChangeText={setSquats} />
        <CaliTextInput label="Plancha (segundos sostenidos)" keyboardType="number-pad" value={plankSeconds} onChangeText={setPlankSeconds} />
        <CaliTextInput label="Fondos / dips (opcional)" keyboardType="number-pad" value={dips} onChangeText={setDips} />

        <CaliButton label="Calcular mi nivel" onPress={onSubmit} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundBase },
  scroll: { padding: spacing.sp6, paddingTop: spacing.sp16, paddingBottom: spacing.sp10 },
  title: { ...typography.displayM, color: colors.textPrimary },
  subtitle: { ...typography.bodyM, color: colors.textSecondary, marginTop: spacing.sp2, marginBottom: spacing.sp8 },
});
