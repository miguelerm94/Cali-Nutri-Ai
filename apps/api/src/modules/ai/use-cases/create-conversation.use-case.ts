import { Injectable } from '@nestjs/common';
import { AiConversationsRepository } from '../repositories/ai-conversations.repository';
import { CreateConversationDto } from '../dto/create-conversation.dto';

/** POST /ai/conversations. */
@Injectable()
export class CreateConversationUseCase {
  constructor(private readonly conversationsRepository: AiConversationsRepository) {}

  async execute(userId: string, dto: CreateConversationDto) {
    const conversation = await this.conversationsRepository.create(userId, dto.title);
    return { id: conversation.id, title: conversation.title, created_at: conversation.createdAt };
  }
}
