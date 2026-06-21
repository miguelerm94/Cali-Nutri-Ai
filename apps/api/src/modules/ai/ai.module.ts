import { Module } from '@nestjs/common';
import { TrainingModule } from '../training/training.module';
import { NutritionModule } from '../nutrition/nutrition.module';
import { HydrationModule } from '../hydration/hydration.module';
import { AnthropicAdapter } from './adapters/anthropic.adapter';
import { ContextBuilderEngine } from './engines/context-builder.engine';
import { AiRateLimiterEngine } from './engines/ai-rate-limiter.engine';
import { AiConversationsRepository } from './repositories/ai-conversations.repository';
import { AiMessagesRepository } from './repositories/ai-messages.repository';
import { ToolExecutorService } from './tools/tool-executor.service';
import { CreateConversationUseCase } from './use-cases/create-conversation.use-case';
import { ListConversationsUseCase } from './use-cases/list-conversations.use-case';
import { GetConversationMessagesUseCase } from './use-cases/get-conversation-messages.use-case';
import { DeleteConversationUseCase } from './use-cases/delete-conversation.use-case';
import { StreamMessageUseCase } from './use-cases/stream-message.use-case';
import { GetAiUsageUseCase } from './use-cases/get-ai-usage.use-case';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';

/**
 * S5b — Coach IA CALI (FD-INFRA-01 semana 10): conversaciones + streaming SSE
 * (FD-ARCH-02), contexto transversal Training+Nutrition+Hydration (FD-ARCH-05),
 * rate limiting por tier (FD-ARCH-04), tool calls (FD-ARCH-05, 6 tools canónicos).
 *
 * Fuera de alcance (documentado, no es un olvido):
 *   - Pipeline de resumen histórico comprimido de 200 tokens (FD-ARCH-03):
 *     diferido — el contexto actual ya cabe sin necesitarlo en v1.0.
 *   - Tier "Admin" de FD-ARCH-04: no existe en `UserTier` (schema.prisma solo
 *     define free/premium) — Layer 1 prevalece, solo se modelan esos dos.
 *   - Invalidación de caché de hidratación por evento (FD-DB-02): ya documentado
 *     como diferido en HydrationModule, no se duplica aquí.
 */
@Module({
  imports: [TrainingModule, NutritionModule, HydrationModule],
  controllers: [AiController],
  providers: [
    AnthropicAdapter,
    ContextBuilderEngine,
    AiRateLimiterEngine,
    AiConversationsRepository,
    AiMessagesRepository,
    ToolExecutorService,
    CreateConversationUseCase,
    ListConversationsUseCase,
    GetConversationMessagesUseCase,
    DeleteConversationUseCase,
    StreamMessageUseCase,
    GetAiUsageUseCase,
    AiService,
  ],
})
export class AiModule {}
