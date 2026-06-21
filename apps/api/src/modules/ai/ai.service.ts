import { Injectable } from '@nestjs/common';
import { CreateConversationUseCase } from './use-cases/create-conversation.use-case';
import { ListConversationsUseCase } from './use-cases/list-conversations.use-case';
import { GetConversationMessagesUseCase } from './use-cases/get-conversation-messages.use-case';
import { DeleteConversationUseCase } from './use-cases/delete-conversation.use-case';
import { StreamMessageUseCase } from './use-cases/stream-message.use-case';
import { GetAiUsageUseCase } from './use-cases/get-ai-usage.use-case';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { AuthUser } from '../../common/interfaces/auth-user.interface';

@Injectable()
export class AiService {
  constructor(
    private readonly createConversationUseCase: CreateConversationUseCase,
    private readonly listConversationsUseCase: ListConversationsUseCase,
    private readonly getConversationMessagesUseCase: GetConversationMessagesUseCase,
    private readonly deleteConversationUseCase: DeleteConversationUseCase,
    private readonly streamMessageUseCase: StreamMessageUseCase,
    private readonly getAiUsageUseCase: GetAiUsageUseCase,
  ) {}

  createConversation(userId: string, dto: CreateConversationDto) {
    return this.createConversationUseCase.execute(userId, dto);
  }

  listConversations(userId: string) {
    return this.listConversationsUseCase.execute(userId);
  }

  getMessages(userId: string, conversationId: string) {
    return this.getConversationMessagesUseCase.execute(userId, conversationId);
  }

  deleteConversation(userId: string, conversationId: string) {
    return this.deleteConversationUseCase.execute(userId, conversationId);
  }

  streamMessage(user: AuthUser, conversationId: string, message: string) {
    return this.streamMessageUseCase.execute(user, conversationId, message);
  }

  getUsage(user: AuthUser) {
    return this.getAiUsageUseCase.execute(user);
  }
}
