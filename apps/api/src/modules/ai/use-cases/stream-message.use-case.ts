import { ForbiddenException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ErrorCode } from '@cali-nutri/shared-types';
import { AiRole } from '@prisma/client';
import { Observable } from 'rxjs';
import type { MessageEvent } from '@nestjs/common';
import type { MessageParam } from '@anthropic-ai/sdk/resources/messages';
import { AnthropicAdapter } from '../adapters/anthropic.adapter';
import { ContextBuilderEngine } from '../engines/context-builder.engine';
import { AiRateLimiterEngine } from '../engines/ai-rate-limiter.engine';
import { AiConversationsRepository } from '../repositories/ai-conversations.repository';
import { AiMessagesRepository } from '../repositories/ai-messages.repository';
import { ToolExecutorService } from '../tools/tool-executor.service';
import { AI_TOOLS } from '../tools/tool-definitions';
import { AuthUser } from '../../../common/interfaces/auth-user.interface';

const MAX_HISTORY_MESSAGES = 20;
const MAX_TOOL_ROUNDS = 3;

/**
 * GET /ai/conversations/:id/stream — SSE (FD-ARCH-02, override de API.md §10
 * que describe WebSockets). El loop de tool-use es agéntico: si Claude pide un
 * tool, se ejecuta, se le devuelve el resultado y se le permite responder de
 * nuevo, hasta MAX_TOOL_ROUNDS para evitar loops infinitos.
 */
@Injectable()
export class StreamMessageUseCase {
  constructor(
    private readonly anthropicAdapter: AnthropicAdapter,
    private readonly contextBuilder: ContextBuilderEngine,
    private readonly rateLimiter: AiRateLimiterEngine,
    private readonly conversationsRepository: AiConversationsRepository,
    private readonly messagesRepository: AiMessagesRepository,
    private readonly toolExecutor: ToolExecutorService,
  ) {}

  async execute(user: AuthUser, conversationId: string, userMessage: string): Promise<Observable<MessageEvent>> {
    const conversation = await this.conversationsRepository.findById(conversationId);
    if (!conversation || conversation.userId !== user.id) {
      throw new ForbiddenException({ code: ErrorCode.FORBIDDEN, message: 'No tienes acceso a esta conversación.' });
    }

    const usage = await this.rateLimiter.checkAndIncrement(user.id, user.tier);
    if (!usage.allowed) {
      throw new HttpException(
        {
          code: ErrorCode.DAILY_LIMIT_REACHED,
          message: 'Alcanzaste tu límite diario de mensajes con CALI.',
          limit: usage.limit,
          reset_at: usage.resetAt.toISOString(),
          upgrade_url: 'cali://upgrade',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    await this.messagesRepository.create({ conversationId, role: AiRole.user, content: userMessage });

    const [system, userContext, history] = await Promise.all([
      Promise.resolve(this.contextBuilder.getSystemPrompt()),
      this.contextBuilder.buildUserContext(user.id),
      this.messagesRepository.findByConversation(conversationId, MAX_HISTORY_MESSAGES),
    ]);

    const fullSystem = `${system}\n\n[CONTEXTO DEL USUARIO]\n${userContext}`;
    const messages: MessageParam[] = history
      .filter((m) => m.role !== AiRole.system)
      .map((m) => ({ role: m.role === AiRole.assistant ? 'assistant' : 'user', content: m.content }));

    return new Observable<MessageEvent>((subscriber) => {
      const startedAt = Date.now();
      this.runAgentLoop(user.id, fullSystem, messages, subscriber)
        .then(async ({ finalText, toolCalls, inputTokens, outputTokens }) => {
          await this.messagesRepository.create({
            conversationId,
            role: AiRole.assistant,
            content: finalText,
            tokensUsed: inputTokens + outputTokens,
            toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
            latencyMs: Date.now() - startedAt,
          });
          subscriber.next({ data: { done: true } });
          subscriber.complete();
        })
        .catch((error) => subscriber.error(error));
    });
  }

  private async runAgentLoop(
    userId: string,
    system: string,
    messages: MessageParam[],
    subscriber: { next: (event: MessageEvent) => void },
  ): Promise<{ finalText: string; toolCalls: unknown[]; inputTokens: number; outputTokens: number }> {
    let conversationMessages = [...messages];
    let aggregatedText = '';
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    const toolCallLog: unknown[] = [];

    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const { textStream, final } = this.anthropicAdapter.streamMessage({ system, messages: conversationMessages, tools: AI_TOOLS });

      for await (const chunk of textStream) {
        aggregatedText += chunk;
        subscriber.next({ data: { delta: chunk } });
      }

      const result = await final;
      totalInputTokens += result.inputTokens;
      totalOutputTokens += result.outputTokens;

      if (result.toolUses.length === 0) {
        return { finalText: aggregatedText, toolCalls: toolCallLog, inputTokens: totalInputTokens, outputTokens: totalOutputTokens };
      }

      conversationMessages = [
        ...conversationMessages,
        { role: 'assistant', content: result.toolUses.map((t) => ({ type: 'tool_use' as const, id: t.id, name: t.name, input: t.input })) },
      ];

      const toolResults = await Promise.all(
        result.toolUses.map((toolUse) =>
          this.toolExecutor.execute(userId, { id: toolUse.id, name: toolUse.name, input: toolUse.input as Record<string, unknown> }),
        ),
      );

      for (const toolResult of toolResults) {
        toolCallLog.push({ tool_use_id: toolResult.tool_use_id, status: toolResult.isError ? 'failed' : 'success', result: toolResult.content });
      }

      conversationMessages = [
        ...conversationMessages,
        {
          role: 'user',
          content: toolResults.map((r) => ({
            type: 'tool_result' as const,
            tool_use_id: r.tool_use_id,
            content: r.content,
            is_error: r.isError,
          })),
        },
      ];
    }

    return { finalText: aggregatedText, toolCalls: toolCallLog, inputTokens: totalInputTokens, outputTokens: totalOutputTokens };
  }
}
