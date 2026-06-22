import React from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { MainTabNavigator } from './MainTabNavigator';
import { OnboardingNavigator } from './OnboardingNavigator';
import { useAuthStore } from '../store/auth.store';
import { colors } from '../theme/tokens';

export type AuthStackParamList = { Login: undefined; Register: undefined };
export type RootStackParamList = { Main: undefined };

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();

const navTheme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: colors.backgroundBase, card: colors.surface100 },
};

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

function MainNavigator() {
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      <RootStack.Screen name="Main" component={MainTabNavigator} />
    </RootStack.Navigator>
  );
}

/**
 * Selecciona Auth vs Onboarding vs Main según el estado del usuario.
 * onboarding_completed=false (FD-ARCH-07) → fuerza el wizard antes de Home.
 */
export function RootNavigator() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const onboardingCompleted = useAuthStore((s) => s.user?.onboarding_completed);

  let content: React.ReactNode;
  if (!isAuthenticated) {
    content = <AuthNavigator />;
  } else if (!onboardingCompleted) {
    content = <OnboardingNavigator />;
  } else {
    content = <MainNavigator />;
  }

  return <NavigationContainer theme={navTheme}>{content}</NavigationContainer>;
}
