import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';

/**
 * EventEmitter2 configurado como bus interno del monolito modular.
 * Permite comunicación entre módulos sin acoplarlos directamente
 * (p. ej. SyncModule emite SYNC_ITEM_RECEIVED; TrainingModule lo escuchará desde S3).
 */
@Module({
  imports: [
    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: '.',
      maxListeners: 20,
      verboseMemoryLeak: true,
    }),
  ],
  exports: [EventEmitterModule],
})
export class EventBusModule {}
