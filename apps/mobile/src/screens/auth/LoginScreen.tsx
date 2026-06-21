import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
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

const loginFormSchema = z.object({
  email: z.string().email('Ingresa un email válido.'),
  password: z.string().min(1, 'Ingresa tu contraseña.'),
});
type LoginFormValues = z.infer<typeof loginFormSchema>;

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

/** Pantalla de login — UXUI.md Auth (3 pantallas MVP). Identidad "Athletic Precision". */
export function LoginScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(false);
  const setSession = useAuthStore((s) => s.setSession);

  const { control, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setLoading(true);
    try {
      const auth = await authApi.login({ email: values.email, password: values.password });
      await setSession(auth);
    } catch (err) {
      Alert.alert('No se pudo iniciar sesión', getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Text style={styles.logo}>CALI</Text>
        <Text style={styles.subtitle}>Calistenia, nutrición e IA en un solo lugar.</Text>
      </View>

      <View style={styles.form}>
        <Controller
          control={control}
          name="email"
          render={({ field }) => (
            <CaliTextInput
              label="Email"
              autoCapitalize="none"
              keyboardType="email-address"
              value={field.value}
              onChangeText={field.onChange}
              error={errors.email?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="password"
          render={({ field }) => (
            <CaliTextInput
              label="Contraseña"
              secureTextEntry
              value={field.value}
              onChangeText={field.onChange}
              error={errors.password?.message}
            />
          )}
        />

        <CaliButton label="Iniciar sesión" onPress={handleSubmit(onSubmit)} loading={loading} />

        <CaliButton
          label="Crear cuenta"
          variant="secondary"
          onPress={() => navigation.navigate('Register')}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundBase, paddingHorizontal: spacing.sp6 },
  header: { marginTop: spacing.sp16, marginBottom: spacing.sp10, alignItems: 'center' },
  logo: { ...typography.displayL, color: colors.lime500 },
  subtitle: { ...typography.bodyM, color: colors.textSecondary, marginTop: spacing.sp2, textAlign: 'center' },
  form: { gap: spacing.sp3 },
});
