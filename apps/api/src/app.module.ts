import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import redisConfig from './config/redis.config';
import jwtConfig from './config/jwt.config';
import awsConfig from './config/aws.config';
import anthropicConfig from './config/anthropic.config';
import supabaseConfig from './config/supabase.config';
import encryptionConfig from './config/encryption.config';
import usdaConfig from './config/usda.config';
import { validateEnv } from './config/config.validation';

import { PrismaModule } from './infrastructure/database/prisma.module';
import { RedisModule } from './infrastructure/redis/redis.module';
import { EncryptionModule } from './infrastructure/encryption/encryption.module';
import { EventBusModule } from './infrastructure/events/event-bus.module';
import { SupabaseModule } from './infrastructure/supabase/supabase.module';

import { AppController } from './app.controller';
import { AuthModule } from './modules/auth/auth.module';
import { SyncModule } from './modules/sync/sync.module';
import { AssessmentModule } from './modules/assessment/assessment.module';
import { TrainingModule } from './modules/training/training.module';
import { NutritionModule } from './modules/nutrition/nutrition.module';
import { HydrationModule } from './modules/hydration/hydration.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';

import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';
import { ValidationExceptionFilter } from './common/filters/validation-exception.filter';

import { RequestContextMiddleware } from './common/middlewares/request-context.middleware';
import { CorrelationIdMiddleware } from './common/middlewares/correlation-id.middleware';
import { RateLimitMiddleware } from './common/middlewares/rate-limit.middleware';
import { SecurityMiddleware } from './common/middlewares/security.middleware';

/**
 * Configuración global (BackendArchitecture.md §3 "Configuración del AppModule"):
 *   JwtAuthGuard global · TransformInterceptor · LoggingInterceptor ·
 *   TimeoutInterceptor (10s default) · HttpExceptionFilter · RequestContextMiddleware primero.
 *
 * Módulos de dominio: Auth, Sync (S1) + Assessment (S2) + Training completo (S3) +
 * Nutrition completo (S4) + Hidratación/Dashboard (S5a). El resto (Users, Body, AI,
 * HealthSync, Notifications, Subscriptions, Analytics) se añaden en S5b-S6b según FD-INFRA-01.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        appConfig,
        databaseConfig,
        redisConfig,
        jwtConfig,
        awsConfig,
        anthropicConfig,
        supabaseConfig,
        encryptionConfig,
        usdaConfig,
      ],
      validate: validateEnv,
    }),
    PrismaModule,
    RedisModule,
    EncryptionModule,
    EventBusModule,
    SupabaseModule,
    AuthModule,
    SyncModule,
    AssessmentModule,
    TrainingModule,
    NutritionModule,
    HydrationModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    { provide: APP_INTERCEPTOR, useClass: TimeoutInterceptor },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_FILTER, useClass: PrismaExceptionFilter },
    { provide: APP_FILTER, useClass: ValidationExceptionFilter },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(RequestContextMiddleware, CorrelationIdMiddleware, SecurityMiddleware, RateLimitMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
