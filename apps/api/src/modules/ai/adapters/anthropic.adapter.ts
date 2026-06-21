import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ErrorCode } from '@cali-nutri/shared-types';
import Anthropic from '@anthropic-ai/sdk';
import type { MessageParam, Tool, ToolUseBlock } from '@anthropic-ai/sdk/resources/messages';

export interface AnthropicStreamResult {
  textStream: AsyncIterable<string>;
  /** Resuelve cuando el stream termina, con el texto completo, tool calls y métricas. */
  final: Promise<{
    text: string;
    toolUses: ToolUseBlock[];
    inputTokens: number;
    outputTokens: number;
  }>;
}

/**
 * Adaptador sobre @anthropic-ai/sdk — FD-ARCH-02 (streaming SSE) + FD-ARCH-05
 * (tool calls). A diferencia de UsdaApiAdapter (que degrada en silencio a []),
 * una falla de Claude no tiene fallback local posible: se traduce siempre en
 * AI_UNAVAILABLE para que el caller la propague al usuario.
 */
@Injectable()
export class AnthropicAdapter {
  private readonly logger = new Logger(AnthropicAdapter.name);
  private readonly client: Anthropic;
  private readonly model: string;
  private readonly maxTokens: number;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('anthropic.apiKey');
    this.model = this.configService.get<string>('anthropic.model') ?? 'claude-sonnet-4-6';
    this.maxTokens = this.configService.get<number>('anthropic.maxTokens') ?? 1000;
    this.client = new Anthropic({ apiKey });
  }

  streamMessage(params: { system: string; messages: MessageParam[]; tools: Tool[] }): AnthropicStreamResult {
    let stream: ReturnType<Anthropic['messages']['stream']>;
    try {
      stream = this.client.messages.stream({
        model: this.model,
        max_tokens: this.maxTokens,
        system: params.system,
        messages: params.messages,
        tools: params.tools,
      });
    } catch (error) {
      this.logger.error(`Claude API no disponible: ${(error as Error).message}`);
      throw new ServiceUnavailableException({ code: ErrorCode.AI_UNAVAILABLE, message: 'CALI no está disponible en este momento.' });
    }

    const textStream = (async function* () {
      try {
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            yield event.delta.text;
          }
        }
      } catch (error) {
        throw new ServiceUnavailableException({ code: ErrorCode.AI_UNAVAILABLE, message: 'CALI no está disponible en este momento.' });
      }
    })();

    const final = stream.finalMessage().then(
      (message) => ({
        text: message.content.filter((b) => b.type === 'text').map((b) => (b as { text: string }).text).join(''),
        toolUses: message.content.filter((b): b is ToolUseBlock => b.type === 'tool_use'),
        inputTokens: message.usage.input_tokens,
        outputTokens: message.usage.output_tokens,
      }),
      (error) => {
        this.logger.error(`Claude API no disponible: ${(error as Error).message}`);
        throw new ServiceUnavailableException({ code: ErrorCode.AI_UNAVAILABLE, message: 'CALI no está disponible en este momento.' });
      },
    );

    return { textStream, final };
  }
}
