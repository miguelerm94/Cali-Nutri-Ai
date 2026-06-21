import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ErrorCode } from '@cali-nutri/shared-types';
import { AiConversationsRepository } from '../repositories/ai-conversations.repository';

/** DELETE /ai/conversations/:id. */
@Injectable()
export class DeleteConversationUseCase {
  constructor(private readonly conversationsRepository: AiConversationsRepository) {}

  async execute(userId: string, conversationId: string): Promise<void> {
    const conversation = await this.conversationsRepository.findById(conversationId);
    if (!conversation) {
      throw new NotFoundException({ code: ErrorCode.RESOURCE_NOT_FOUND, message: 'La conversación no existe.' });
    }
    if (conversation.userId !== userId) {
      throw new ForbiddenException({ code: ErrorCode.FORBIDDEN, message: 'No tienes acceso a esta conversación.' });
    }
    await this.conversationsRepository.delete(conversationId);
  }
}
