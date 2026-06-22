import React, { useEffect, useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, typography } from '../theme/tokens';
import { aiApi } from '../services/ai.api';
import { CaliButton } from '../components/CaliButton';
import { CaliTextInput } from '../components/CaliTextInput';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

/**
 * TAB 5 — Coach IA / CALI (UXUI.md §3.1, FD-ARCH-02 streaming SSE). v1: una
 * sola conversación activa. Quick Action Shortcuts y Full Conversation History
 * (varias conversaciones) quedan para v1.1.
 */
export function AiChatScreen() {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    aiApi
      .createConversation()
      .then((c) => setConversationId(c.id))
      .catch(() => setError('No se pudo iniciar la conversación con CALI.'));
  }, []);

  const handleSend = async () => {
    if (!conversationId || !input.trim() || sending) return;
    const userMessage: ChatMessage = { id: `u-${Date.now()}`, role: 'user', content: input.trim() };
    const assistantId = `a-${Date.now()}`;
    setMessages((prev) => [...prev, userMessage, { id: assistantId, role: 'assistant', content: '' }]);
    setInput('');
    setSending(true);
    setError(null);

    try {
      await aiApi.streamMessage(conversationId, userMessage.content, (delta) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + delta } : m)),
        );
      });
    } catch {
      setError('CALI no está disponible en este momento.');
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>CALI</Text>
      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.list}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.role === 'user' ? styles.bubbleUser : styles.bubbleAssistant]}>
            <Text style={item.role === 'user' ? styles.bubbleTextInverse : styles.bubbleText}>{item.content || '...'}</Text>
          </View>
        )}
      />

      <View style={styles.inputRow}>
        <View style={styles.inputField}>
          <CaliTextInput label="" placeholder="Escribile a CALI..." value={input} onChangeText={setInput} onSubmitEditing={handleSend} />
        </View>
        <CaliButton label="Enviar" onPress={handleSend} loading={sending} disabled={!input.trim() || !conversationId} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundBase, padding: spacing.sp6, gap: spacing.sp4 },
  title: { ...typography.displayM, color: colors.textPrimary },
  error: { ...typography.bodyM, color: colors.error },
  list: { gap: spacing.sp2 },
  bubble: { borderRadius: radii.lg, padding: spacing.sp3, maxWidth: '85%' },
  bubbleUser: { backgroundColor: colors.lime500, alignSelf: 'flex-end' },
  bubbleAssistant: { backgroundColor: colors.surface100, alignSelf: 'flex-start', borderWidth: 1, borderColor: colors.borderSubtle },
  bubbleText: { ...typography.bodyM, color: colors.textPrimary },
  bubbleTextInverse: { ...typography.bodyM, color: colors.textInverse },
  inputRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sp2 },
  inputField: { flex: 1 },
});
