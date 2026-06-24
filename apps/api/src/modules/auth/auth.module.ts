import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { DevJwtStrategy } from './strategies/dev-jwt.strategy';
import { DevAuthService } from './dev-auth.service';
import { AuthRepository } from './repositories/auth.repository';
import { RegisterUseCase } from './use-cases/register.use-case';
import { LoginUseCase } from './use-cases/login.use-case';
import { RefreshTokenUseCase } from './use-cases/refresh-token.use-case';
import { LogoutUseCase } from './use-cases/logout.use-case';
import { ForgotPasswordUseCase } from './use-cases/forgot-password.use-case';
import { ResetPasswordUseCase } from './use-cases/reset-password.use-case';
import { OAuthLoginUseCase } from './use-cases/oauth-login.use-case';

/**
 * Dependencias (BackendArchitecture.md §3): PrismaModule, RedisModule y
 * SupabaseModule son @Global() — no requieren import explícito aquí.
 */
@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthRepository,
    JwtStrategy,
    // Seam de auth local — solo opera con DEV_AUTH_ENABLED=true (inerte en prod).
    DevAuthService,
    DevJwtStrategy,
    RegisterUseCase,
    LoginUseCase,
    RefreshTokenUseCase,
    LogoutUseCase,
    ForgotPasswordUseCase,
    ResetPasswordUseCase,
    OAuthLoginUseCase,
  ],
  exports: [AuthService],
})
export class AuthModule {}
