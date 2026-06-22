import Constants from 'expo-constants';
import { apiClient } from './api-client';
import { useAuthStore } from '../store/auth.store';

const baseURL = (Constants.expoConfig?.extra?.apiBaseUrl as string) ?? 'https://api.calinutri.app/v1';

export interface AiConversation {
  id: string;
  title?: string;
  createdAt: string;
}

export const aiApi = {
  async listConversations(): Promise<AiConversation[]> {
    const { data } = await apiClient.get('/ai/conversations');
    return data.data;
  },

  async createConversation(): Promise<AiConversation> {
    const { data } = await apiClient.post('/ai/conversations', {});
    return data.data;
  },

  async getMessages(conversationId: string) {
    const { data } = await apiClient.get(`/ai/conversations/${conversationId}/messages`);
    return data.data;
  },

  /**
   * SSE manual con fetch (no EventSource): EventSource no permite headers
   * custom, y la ruta requiere Authorization: Bearer <token> (FD-ARCH-01).
   */
  async streamMessage(
    conversationId: string,
    message: string,
    onDelta: (chunk: string) => void,
  ): Promise<void> {
    const token = useAuthStore.getState().accessToken;
    const url = `${baseURL}/ai/conversations/${conversationId}/stream?message=${encodeURIComponent(message)}`;
    const response = await fetch(url, {
      headers: { Authorization: token ? `Bearer ${token}` : '', Accept: 'text/event-stream' },
    });
    if (!response.ok || !response.body) {
      throw new Error(`Stream falló con status ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const events = buffer.split('\n\n');
      buffer = events.pop() ?? '';
      for (const event of events) {
        const line = event.split('\n').find((l) => l.startsWith('data:'));
        if (!line) continue;
        const payload = JSON.parse(line.slice(5).trim());
        if (payload.delta) onDelta(payload.delta);
      }
    }
  },
};
