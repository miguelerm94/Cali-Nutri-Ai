import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OnboardingProgress } from '../../components/OnboardingProgress';
import { SelectableCard } from '../../components/SelectableCard';
import { CaliButton } from '../../components/CaliButton';
import { CaliTextInput } from '../../components/CaliTextInput';
import { colors, spacing, typography } from '../../theme/tokens';
import { useOnboardingStore } from '../../store/onboarding.store';
import { UnitConversion } from '@cali-nutri/shared-types';
import { OnboardingStackParamList } from '../../navigation/OnboardingNavigator';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Biometrics'>;

/** Onboarding paso 3: biométricos + unidades (A-03). Siempre se persiste en métrico. */
export function BiometricsStep({ navigation }: Props) {
  const { data, updateData, setStep } = useOnboardingStore();
  const [unit, setUnit] = useState<'metric' | 'imperial'>(data.unit_preference);
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [targetWeight, setTargetWeight] = useState('');

  const onNext = () => {
    const h = parseFloat(height);
    const w = parseFloat(weight);
    const tw = targetWeight ? parseFloat(targetWeight) : undefined;
    if (!h || !w) {
      Alert.alert('Faltan datos', 'Ingresa tu altura y peso actuales.');
      return;
    }
    const heightCm = unit === 'imperial' ? UnitConversion.inchesToCm(h) : h;
    const weightKg = unit === 'imperial' ? UnitConversion.lbsToKg(w) : w;
    const targetWeightKg = tw ? (unit === 'imperial' ? UnitConversion.lbsToKg(tw) : tw) : undefined;

    updateData({ unit_preference: unit, height_cm: Math.round(heightCm), weight_kg: weightKg, target_weight_kg: targetWeightKg });
    setStep(4);
    navigation.navigate('Goal');
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <OnboardingProgress currentStep={3} />
        <Text style={styles.title}>Tus medidas</Text>
        <Text style={styles.subtitle}>Elige tu sistema de unidades preferido — puedes cambiarlo después.</Text>

        <View style={styles.unitRow}>
          <View style={{ flex: 1 }}>
            <SelectableCard title="Métrico (kg/cm)" selected={unit === 'metric'} onPress={() => setUnit('metric')} />
          </View>
          <View style={{ width: spacing.sp3 }} />
          <View style={{ flex: 1 }}>
            <SelectableCard title="Imperial (lb/in)" selected={unit === 'imperial'} onPress={() => setUnit('imperial')} />
          </View>
        </View>

        <CaliTextInput
          label={`Altura (${unit === 'metric' ? 'cm' : 'pulgadas'})`}
          keyboardType="decimal-pad"
          value={height}
          onChangeText={setHeight}
        />
        <CaliTextInput
          label={`Peso actual (${unit === 'metric' ? 'kg' : 'lb'})`}
          keyboardType="decimal-pad"
          value={weight}
          onChangeText={setWeight}
        />
        <CaliTextInput
          label={`Peso objetivo (${unit === 'metric' ? 'kg' : 'lb'}) — opcional`}
          keyboardType="decimal-pad"
          value={targetWeight}
          onChangeText={setTargetWeight}
        />

        <CaliButton label="Continuar" onPress={onNext} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundBase },
  scroll: { padding: spacing.sp6, paddingTop: spacing.sp16 },
  title: { ...typography.displayM, color: colors.textPrimary },
  subtitle: { ...typography.bodyM, color: colors.textSecondary, marginTop: spacing.sp2, marginBottom: spacing.sp8 },
  unitRow: { flexDirection: 'row', marginBottom: spacing.sp4 },
});
