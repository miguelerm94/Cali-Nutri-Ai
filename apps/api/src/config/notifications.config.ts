import { registerAs } from '@nestjs/config';

/** Expo Push API — EXPO_ACCESS_TOKEN solo es necesario en modo "enhanced security". */
export default registerAs('notifications', () => ({
  expoAccessToken: process.env.EXPO_ACCESS_TOKEN,
}));
