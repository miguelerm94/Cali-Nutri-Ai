import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

@Injectable()
export class AiConversationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(userId: string, title?: string) {
    return this.prisma.aiConversation.create({ data: { userId, title } });
  }

  findById(id: string) {
    return this.prisma.aiConversation.findUnique({ where: { id } });
  }

  findByUser(userId: string) {
    return this.prisma.aiConversation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  delete(id: string) {
    return this.prisma.aiConversation.delete({ where: { id } });
  }
}
