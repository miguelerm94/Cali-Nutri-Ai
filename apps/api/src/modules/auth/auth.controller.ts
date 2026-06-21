import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UnauthorizedException,
  UsePipes,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { registerSchema, RegisterDto } from './dto/register.dto';
import { loginSchema, LoginDto } from './dto/login.dto';
import { refreshTokenSchema, RefreshTokenDto } from './dto/refresh-token.dto';
import { forgotPasswordSchema, ForgotPasswordDto } from './dto/forgot-password.dto';
import { resetPasswordSchema, ResetPasswordDto } from './dto/reset-password.dto';
import { oauthLoginSchema, OAuthLoginDto } from './dto/oauth-login.dto';
import { ErrorCode } from '@cali-nutri/shared-types';

/** Base path: /auth (API.md §2). Rutas públicas excepto /logout y /me. */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(registerSchema))
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(loginSchema))
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(refreshTokenSchema))
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshTokens(dto.refresh_token);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request) {
    const authHeader = req.headers.authorization;
    const accessToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
    if (!accessToken) {
      throw new UnauthorizedException({
        code: ErrorCode.INVALID_TOKEN,
        message: 'Token de acceso requerido.',
      });
    }
    await this.authService.logout(accessToken);
    return { message: 'Sesión cerrada correctamente' };
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(forgotPasswordSchema))
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.forgotPassword(dto.email);
    return { message: 'Si el email existe, recibirás instrucciones en los próximos minutos' };
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(resetPasswordSchema))
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto.reset_token, dto.new_password);
    return { message: 'Contraseña actualizada. Por favor, inicia sesión nuevamente.' };
  }

  @Public()
  @Post('oauth/:provider')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(oauthLoginSchema))
  oauthLogin(@Body() dto: OAuthLoginDto) {
    return this.authService.oauthLogin(dto);
  }

  @Get('me')
  async me(@CurrentUser() currentUser: AuthUser) {
    const user = await this.authService.getMe(currentUser.id);
    return {
      id: user!.id,
      email: user!.email,
      first_name: user!.firstName,
      last_name: user!.lastName,
      onboarding_completed: user!.onboardingComplete,
      created_at: user!.createdAt.toISOString(),
    };
  }
}
