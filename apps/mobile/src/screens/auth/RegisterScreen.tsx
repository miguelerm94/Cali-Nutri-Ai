import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CaliButton } from '../../components/CaliButton';
import { CaliTextInput } from '../../components/CaliTextInput';
import { colors, spacing, typography } from '../../theme/tokens';
import { authApi } from '../../services/auth.api';
import { getApiErrorMessage } from '../../services/api-client';
import { useAuthStore } from '../../store/auth.store';
import { AuthStackParamList } from '../../navigation/RootNavigator';

/** Espejo de registerSchema del backend (API.md §2) — feedback inmediato en cliente. */
const registerFormSchema = z
  .object({
    first_name: z.string().min(2, 'Mínimo 2 caracteres.'),
    last_name: z.string().optional(),
    email: z.string().email('Ingresa un email válido.'),
    password: z
      .string()
      .min(8, 'Mínimo 8 caracteres.')
      .regex(/[A-Z]/, 'Incluye al menos una mayúscula.')
      .regex(/[0-9]/, 'Incluye al menos un número.')
      .regex(/[^A-Za-z0-9]/, 'Incluye al menos un símbolo.'),
    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirm_password'],
  });
type RegisterFormValues = z.infer<typeof registerFormSchema>;

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(false);
  const setSession = useAuthStore((s) => s.setSession);

  const { control, handleSubmit, formState: { errors } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: { first_name: '', last_name: '', email: '', password: '', confirm_password: '' },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setLoading(true);
    try {
      const auth = await authApi.register({
        email: values.email,
        password: values.password,
        first_name: values.first_name,
        last_name: values.last_name,
        accept_terms: true,
        accept_privacy: true,
      });
      await setSession(auth);
    } catch (err) {
      Alert.alert('No se pudo crear la cuenta', getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Crear cuenta</Text>
        <Text style={styles.subtitle}>Empieza tu progreso con CALI.</Text>

        <View style={styles.form}>
          <Controller control={control} name="first_name" render={({ field }) => (
            <CaliTextInput label="Nombre" value={field.value} onChangeText={field.onChange} error={errors.first_name?.message} />
          )} />
          <Controller control={control} name="last_name" render={({ field }) => (
            <CaliTextInput label="Apellido (opcional)" value={field.value} onChangeText={field.onChange} />
          )} />
          <Controller control={control} name="email" render={({ field }) => (
            <CaliTextInput label="Email" autoCapitalize="none" keyboardType="email-address" value={field.value} onChangeText={field.onChange} error={errors.email?.message} />
          )} />
          <Controller control={control} name="password" render={({ field }) => (
            <CaliTextInput label="Contraseña" secureTextEntry value={field.value} onChangeText={field.onChange} error={errors.password?.message} />
          )} />
          <Controller control={control} name="confirm_password" render={({ field }) => (
            <CaliTextInput label="Confirmar contraseña" secureTextEntry value={field.value} onChangeText={field.onChange} error={errors.confirm_password?.message} />
          )} />

          <Text style={styles.terms}>
            Al continuar aceptas los Términos de Servicio y la Política de Privacidad de CALI-NUTRI AI.
          </Text>

          <CaliButton label="Crear cuenta" onPress={handleSubmit(onSubmit)} loading={loading} />
          <CaliButton label="Ya tengo cuenta" variant="secondary" onPress={() => navigation.navigate('Login')} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundBase },
  scroll: { paddingHorizontal: spacing.sp6, paddingTop: spacing.sp16, paddingBottom: spacing.sp10 },
  title: { ...typography.displayM, color: colors.textPrimary },
  subtitle: { ...typography.bodyM, color: colors.textSecondary, marginTop: spacing.sp2, marginBottom: spacing.sp8 },
  form: { gap: spacing.sp3 },
  terms: { ...typography.caption, color: colors.textSecondary, marginVertical: spacing.sp3 },
});
