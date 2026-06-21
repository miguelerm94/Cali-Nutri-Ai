import { ExpoConfig, ConfigContext } from 'expo/config';

/**
 * Config dinámica de Expo. Fuente: MVP.md (Expo SDK 51) + FD-INFRA-01 (A-06 OTA Updates).
 * Deep linking scheme "cali://" — usado por notificaciones (A-04) y CALI.
 */
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'CALI-NUTRI AI',
  slug: 'cali-nutri-ai',
  scheme: 'cali',
  version: '1.0.0',
  orientation: 'portrait',
  userInterfaceStyle: 'dark', // UXUI.md: "la app es nativa dark-first"
  icon: './assets/icon.png',
  splash: {
    image: './assets/splash.png',
    backgroundColor: '#080810', // UXUI.md Background Base
  },
  ios: {
    bundleIdentifier: 'app.calinutri.mobile',
    supportsTablet: false,
    usesAppleSignIn: true,
  },
  android: {
    package: 'app.calinutri.mobile',
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#080810',
    },
  },
  plugins: ['expo-secure-store', 'expo-apple-authentication'],
  extra: {
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://api.calinutri.app/v1',
    eas: { projectId: process.env.EAS_PROJECT_ID },
  },
  updates: {
    // A-06 — OTA Updates (S1). Canal mapeado por eas.json / eas-update.yml.
    url: `https://u.expo.dev/${process.env.EAS_PROJECT_ID ?? ''}`,
  },
  runtimeVersion: { policy: 'appVersion' },
});
