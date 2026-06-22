import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { DashboardScreen } from '../screens/DashboardScreen';
import { TrainingScreen } from '../screens/TrainingScreen';
import { NutritionScreen } from '../screens/NutritionScreen';
import { HydrationScreen } from '../screens/HydrationScreen';
import { AiChatScreen } from '../screens/AiChatScreen';
import { colors } from '../theme/tokens';

export type MainTabParamList = {
  Dashboard: undefined;
  Training: undefined;
  Nutrition: undefined;
  Hydration: undefined;
  Cali: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_ICONS: Record<keyof MainTabParamList, string> = {
  Dashboard: '🏠',
  Training: '💪',
  Nutrition: '🍽️',
  Hydration: '💧',
  Cali: '✨',
};

/** UXUI.md §3.1-3.2 — Main Tab Navigator de 5 ítems (Dashboard/Training/Nutrition/Hydration/CALI). */
export function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.lime500,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: { backgroundColor: colors.surface100, borderTopColor: colors.borderSubtle },
        tabBarIcon: () => <Text>{TAB_ICONS[route.name]}</Text>,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="Training" component={TrainingScreen} options={{ tabBarLabel: 'Train' }} />
      <Tab.Screen name="Nutrition" component={NutritionScreen} options={{ tabBarLabel: 'Nutri' }} />
      <Tab.Screen name="Hydration" component={HydrationScreen} options={{ tabBarLabel: 'Water' }} />
      <Tab.Screen name="Cali" component={AiChatScreen} options={{ tabBarLabel: 'CALI' }} />
    </Tab.Navigator>
  );
}
