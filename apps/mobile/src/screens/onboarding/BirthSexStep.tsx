import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OnboardingProgress } from '../../components/OnboardingProgress';
import { SelectableCard } from '../../components/SelectableCard';
import { CaliButton } from '../../components/CaliButton';
import { CaliTextInput } from '../../components/CaliTextInput';
import { colors, spacing, typography } from '../../theme/tokens';
import { useOnboardingStore } from '../../store/onboarding.store';
import { OnboardingStackParamList } from '../../navigation/OnboardingNavigator';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'BirthSex'>;

/** Onboarding paso 2: nacimiento + sexo (FD-ARCH-07). Requerido para Mifflin-St Jeor (FD-05). */
export function BirthSexStep({ navigation }: Props) {
  const { data, updateData, setStep } = useOnboardingStore();
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [sex, setSex] = useState<'male' | 'female' | undefined>(data.sex);

  const onNext = () => {
    const d = parseInt(day, 10);
    const m = parseInt(month, 10);
    const y = parseInt(year, 10);
    if (!d || !m || !y || y < 1920 || y > new Date().getFullYear() - 10) {
      Alert.alert('Fecha inválida', 'Revisa tu fecha de nacimiento.');
      return;
    }
    if (!sex) {
      Alert.alert('Falta un dato', 'Selecciona tu sexo biológico (usado en el cálculo de TMB).');
      return;
    }
    const birthDate = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    updateData({ birth_date: birthDate, sex });
    setStep(3);
    navigation.navigate('Biometrics');
  };

  return (
    <View style={styles.container}>
      <OnboardingProgress currentStep={2} />
      <Text style={styles.title}>Cuéntanos de ti</Text>
      <Text style={styles.subtitle}>Usamos esto para calcular tu metabolismo con precisión clínica.</Text>

      <Text style={styles.label}>Fecha de nacimiento</Text>
      <View style={styles.row}>
        <View style={styles.dateInputWrap}>
          <CaliTextInput label="Día" keyboardType="number-pad" maxLength={2} value={day} onChangeText={setDay} />
        </View>
        <View style={styles.dateInputWrap}>
          <CaliTextInput label="Mes" keyboardType="number-pad" maxLength={2} value={month} onChangeText={setMonth} />
        </View>
        <View style={styles.dateInputWrap}>
          <CaliTextInput label="Año" keyboardType="number-pad" maxLength={4} value={year} onChangeText={setYear} />
        </View>
      </View>

      <Text style={styles.label}>Sexo biológico</Text>
      <SelectableCard title="Hombre" selected={sex === 'male'} onPress={() => setSex('male')} />
      <SelectableCard title="Mujer" selected={sex === 'female'} onPress={() => setSex('female')} />

      <CaliButton label="Continuar" onPress={onNext} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundBase, padding: spacing.sp6, paddingTop: spacing.sp16 },
  title: { ...typography.displayM, color: colors.textPrimary },
  subtitle: { ...typography.bodyM, color: colors.textSecondary, marginTop: spacing.sp2, marginBottom: spacing.sp8 },
  label: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.sp2, marginTop: spacing.sp2 },
  row: { flexDirection: 'row', gap: spacing.sp3 },
  dateInputWrap: { flex: 1 },
});
