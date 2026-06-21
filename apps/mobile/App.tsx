import React, { useCallback, useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useFonts as useSpaceGrotesk,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import { useFonts as useInter, Inter_400Regular, Inter_500Medium } from '@expo-google-fonts/inter';
import {
  useFonts as useJetBrainsMono,
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
} from '@expo-google-fonts/jetbrains-mono';

import { RootNavigator } from './src/navigation/RootNavigator';
import { useAuthStore } from './src/store/auth.store';
import { secureTokenStorage } from './src/services/secure-token-storage';
import { apiClient } from './src/services/api-client';
import { offlineQueueService } from './src/services/offline-queue.service';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

export default function App() {
  const [spaceGroteskLoaded] = useSpaceGrotesk({ SpaceGrotesk_500Medium, SpaceGrotesk_600SemiBold, SpaceGrotesk_700Bold });
  const [interLoaded] = useInter({ Inter_400Regular, Inter_500Medium });
  const [monoLoaded] = useJetBrainsMono({ JetBrainsMono_400Regular, JetBrainsMono_500Medium });
  const fontsLoaded = spaceGroteskLoaded && interLoaded && monoLoaded;

  const isHydrating = useAuthStore((s) => s.isHydrating);
  const setSession = useAuthStore((s) => s.setSession);
  const [ready, setReady] = useState(false);

  // Intenta restaurar sesión con el refresh_token guardado en Keychain/EncryptedSharedPreferences.
  useEffect(() => {
    (async () => {
      try {
        const refreshToken = await secureTokenStorage.getRefreshToken();
        if (refreshToken) {
          const { data } = await apiClient.post('/auth/refresh', { refresh_token: refreshToken });
          const me = await apiClient.get('/auth/me', {
            headers: { Authorization: `Bearer ${data.data.access_token}` },
          });
          await setSession({ user: me.data.data, tokens: data.data });
        }
      } catch {
        await useAuthStore.getState().clearSession();
      } finally {
        useAuthStore.setState({ isHydrating: false });
        setReady(true);
      }
    })();
  }, [setSession]);

  // A-01 — auto-flush de la cola offline al recuperar conexión.
  useEffect(() => {
    const unsubscribe = offlineQueueService.startAutoFlush();
    return unsubscribe;
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded && ready && !isHydrating) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, ready, isHydrating]);

  useEffect(() => {
    onLayoutRootView();
  }, [onLayoutRootView]);

  if (!fontsLoaded || !ready || isHydrating) return null;

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="light" />
        <RootNavigator />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
