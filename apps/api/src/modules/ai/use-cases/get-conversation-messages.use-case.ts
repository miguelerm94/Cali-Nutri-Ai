import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ErrorCode } from '@cali-nutri/shared-types';
import { AiConversationsRepository } from '../repositories/ai-conversations.repository';
import { AiMessagesRepository } from '../repositories/ai-messages.repository';

const MAX_MESSAGES = 50;

/** GET /ai/conversations/:id/messages. */
@Injectable()
export class GetConversationMessagesUseCase {
  constructor(
    private readonly conversationsRepository: AiConversationsRepository,
    private readonly messagesRepository: AiMessagesRepository,
  ) {}

  async execute(userId: string, conversationId: string) {
    const conversation = await this.conversationsRepository.findById(conversationId);
    if (!conversation) {
      throw new NotFoundException({ code: ErrorCode.RESOURCE_NOT_FOUND, message: 'La conversación no existe.' });
    }
    if (conversation.userId !== userId) {
      throw new ForbiddenException({ code: ErrorCode.FORBIDDEN, message: 'No tienes acceso a esta conversación.' });
    }

    const messages = await this.messagesRepository.findByConversation(conversationId, MAX_MESSAGES);
    return messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      tool_calls: m.toolCalls,
      created_at: m.createdAt,
    }));
  }
}
