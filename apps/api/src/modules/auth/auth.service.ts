import { Injectable } from '@nestjs/common';
import { RegisterUseCase } from './use-cases/register.use-case';
import { LoginUseCase } from './use-cases/login.use-case';
import { RefreshTokenUseCase } from './use-cases/refresh-token.use-case';
import { LogoutUseCase } from './use-cases/logout.use-case';
import { ForgotPasswordUseCase } from './use-cases/forgot-password.use-case';
import { ResetPasswordUseCase } from './use-cases/reset-password.use-case';
import { OAuthLoginUseCase } from './use-cases/oauth-login.use-case';
import { AuthRepository } from './repositories/auth.repository';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { OAuthLoginDto } from './dto/oauth-login.dto';
import { AuthResponseDto, TokensDto } from '@cali-nutri/shared-types';

/**
 * Fachada del módulo Auth. Cada método único y acotado delega en su use-case
 * (BackendArchitecture.md §4 — Single Responsibility por caso de uso).
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly forgotPasswordUseCase: ForgotPasswordUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
    private readonly oauthLoginUseCase: OAuthLoginUseCase,
    private readonly authRepository: AuthRepository,
  ) {}

  register(dto: RegisterDto): Promise<AuthResponseDto> {
    return this.registerUseCase.execute(dto);
  }

  login(dto: LoginDto): Promise<AuthResponseDto> {
    return this.loginUseCase.execute(dto);
  }

  refreshTokens(refreshToken: string): Promise<TokensDto> {
    return this.refreshTokenUseCase.execute(refreshToken);
  }

  logout(accessToken: string): Promise<void> {
    return this.logoutUseCase.execute(accessToken);
  }

  forgotPassword(email: string): Promise<void> {
    return this.forgotPasswordUseCase.execute(email);
  }

  resetPassword(resetToken: string, newPassword: string): Promise<void> {
    return this.resetPasswordUseCase.execute(resetToken, newPassword);
  }

  oauthLogin(dto: OAuthLoginDto): Promise<AuthResponseDto> {
    return this.oauthLoginUseCase.execute(dto);
  }

  async getMe(userId: string) {
    const user = await this.authRepository.findById(userId);
    return user;
  }
}
