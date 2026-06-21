import { Injectable } from '@nestjs/common';
import { AiRole } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { EncryptionService } from '../../../infrastructure/encryption/encryption.service';

export interface DecryptedAiMessage {
  id: string;
  conversationId: string;
  role: AiRole;
  content: string;
  tokensUsed: number | null;
  toolCalls: unknown;
  latencyMs: number | null;
  createdAt: Date;
}

/** FD-DB-06: content viaja siempre cifrado en DB — encrypt al escribir, decrypt al leer. */
@Injectable()
export class AiMessagesRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryptionService: EncryptionService,
  ) {}

  async create(params: {
    conversationId: string;
    role: AiRole;
    content: string;
    tokensUsed?: number;
    toolCalls?: unknown;
    latencyMs?: number;
  }): Promise<DecryptedAiMessage> {
    const { content, contentIv } = this.encryptionService.encrypt(params.content);
    const message = await this.prisma.aiMessage.create({
      data: {
        conversationId: params.conversationId,
        role: params.role,
        content,
        contentIv,
        tokensUsed: params.tokensUsed,
        toolCalls: params.toolCalls as never,
        latencyMs: params.latencyMs,
      },
    });
    return this.decrypt(message);
  }

  async findByConversation(conversationId: string, limit: number): Promise<DecryptedAiMessage[]> {
    const messages = await this.prisma.aiMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return messages.reverse().map((m) => this.decrypt(m));
  }

  private decrypt(message: {
    id: string;
    conversationId: string;
    role: AiRole;
    content: string;
    contentIv: string;
    tokensUsed: number | null;
    toolCalls: unknown;
    latencyMs: number | null;
    createdAt: Date;
  }): DecryptedAiMessage {
    return {
      id: message.id,
      conversationId: message.conversationId,
      role: message.role,
      content: this.encryptionService.decrypt(message.content, message.contentIv),
      tokensUsed: message.tokensUsed,
      toolCalls: message.toolCalls,
      latencyMs: message.latencyMs,
      createdAt: message.createdAt,
    };
  }
}
