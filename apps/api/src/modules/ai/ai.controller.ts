import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Query, Sse, UsePipes } from '@nestjs/common';
import { Observable } from 'rxjs';
import type { MessageEvent } from '@nestjs/common';
import { AiService } from './ai.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { createConversationSchema, CreateConversationDto } from './dto/create-conversation.dto';

/**
 * Base path: /ai (FD-INFRA-01 semana 10). FD-ARCH-02: streaming vía SSE, no
 * WebSockets (override de API.md §10).
 */
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('conversations')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(createConversationSchema))
  createConversation(@Body() dto: CreateConversationDto, @CurrentUser() user: AuthUser) {
    return this.aiService.createConversation(user.id, dto);
  }

  @Get('conversations')
  listConversations(@CurrentUser() user: AuthUser) {
    return this.aiService.listConversations(user.id);
  }

  @Get('conversations/:id/messages')
  getMessages(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.aiService.getMessages(user.id, id);
  }

  @Delete('conversations/:id')
  deleteConversation(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.aiService.deleteConversation(user.id, id);
  }

  @Sse('conversations/:id/stream')
  streamMessage(
    @Param('id') id: string,
    @Query('message') message: string,
    @CurrentUser() user: AuthUser,
  ): Promise<Observable<MessageEvent>> {
    return this.aiService.streamMessage(user, id, message);
  }

  @Get('usage')
  getUsage(@CurrentUser() user: AuthUser) {
    return this.aiService.getUsage(user);
  }
}
