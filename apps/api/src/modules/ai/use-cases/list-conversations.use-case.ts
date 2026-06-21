import { Injectable } from '@nestjs/common';
import { AiConversationsRepository } from '../repositories/ai-conversations.repository';

/** GET /ai/conversations. */
@Injectable()
export class ListConversationsUseCase {
  constructor(private readonly conversationsRepository: AiConversationsRepository) {}

  async execute(userId: string) {
    const conversations = await this.conversationsRepository.findByUser(userId);
    return conversations.map((c) => ({
      id: c.id,
      title: c.title,
      is_active: c.isActive,
      created_at: c.createdAt,
      updated_at: c.updatedAt,
    }));
  }
}
