import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const EXPO_PUSH_API_URL = 'https://exp.host/--/api/v2/push/send';

/**
 * Adaptador sobre la Expo Push API. A diferencia de AnthropicAdapter, una
 * falla de envío push NO debe propagarse al caller: el push es best-effort
 * (el usuario igual puede ver la alerta dentro de la app vía NotificationLog).
 */
@Injectable()
export class ExpoPushAdapter {
  private readonly logger = new Logger(ExpoPushAdapter.name);

  constructor(private readonly configService: ConfigService) {}

  async send(tokens: string[], title: string, body: string, data?: Record<string, unknown>): Promise<void> {
    if (tokens.length === 0) return;

    const accessToken = this.configService.get<string>('notifications.expoAccessToken');
    const headers: Record<string, string> = { 'Content-Type': 'application/json', Accept: 'application/json' };
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    try {
      const response = await fetch(EXPO_PUSH_API_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify(tokens.map((to) => ({ to, title, body, data }))),
      });
      if (!response.ok) {
        this.logger.warn(`Expo push respondió ${response.status}`);
      }
    } catch (error) {
      this.logger.warn(`Falló el envío de push, se ignora (best-effort): ${(error as Error).message}`);
    }
  }
}
