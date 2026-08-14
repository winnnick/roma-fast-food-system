import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UnauthorizedException,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CommandBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';

import { LoginCommand } from '../../application/auth/login.command';
import { LogoutCommand } from '../../application/auth/logout.command';
import { RefreshSessionCommand } from '../../application/auth/refresh-session.command';
import type {
  AccessTokenClaims,
  AuthSessionResult,
  InternalAuthSessionResult,
} from '../../domain/models/auth.models';
import { CurrentAuthUser } from './current-auth-user.decorator';
import { LoginRequestDto } from './dto/login-request.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  private readonly cookieName: string;
  private readonly cookieSecure: boolean;
  private readonly refreshTtlSeconds: number;

  constructor(
    private readonly commandBus: CommandBus,
    config: ConfigService,
  ) {
    this.cookieName = config.get<string>('REFRESH_COOKIE_NAME', 'roma_refresh_token');
    this.cookieSecure = config.get<string>('REFRESH_COOKIE_SECURE', 'false') === 'true';
    const rawRefreshTtl = config.get<string>('REFRESH_TOKEN_TTL_SECONDS');
    const parsedRefreshTtl = Number(rawRefreshTtl ?? 43_200);
    this.refreshTtlSeconds =
      Number.isSafeInteger(parsedRefreshTtl) && parsedRefreshTtl > 0 ? parsedRefreshTtl : 43_200;
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Inicia una única sesión y emite el JWT de acceso.' })
  async login(
    @Body() dto: LoginRequestDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthSessionResult> {
    const result = await this.commandBus.execute<LoginCommand, InternalAuthSessionResult>(
      new LoginCommand(dto.username, dto.password, this.getUserAgent(request), request.ip ?? null),
    );

    this.setRefreshCookie(response, result.refreshToken);
    return this.toPublicResult(result);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Rota el refresh token y renueva el JWT sin volver a pedir credenciales.',
  })
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthSessionResult> {
    const refreshToken = this.readCookie(request, this.cookieName);
    if (!refreshToken) {
      throw new UnauthorizedException('No se encontró una sesión renovable.');
    }

    const result = await this.commandBus.execute<RefreshSessionCommand, InternalAuthSessionResult>(
      new RefreshSessionCommand(refreshToken, this.getUserAgent(request), request.ip ?? null),
    );

    this.setRefreshCookie(response, result.refreshToken);
    return this.toPublicResult(result);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoca la sesión renovable actual.' })
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    await this.commandBus.execute(new LogoutCommand(this.readCookie(request, this.cookieName)));
    response.clearCookie(this.cookieName, this.cookieOptions());
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Devuelve la identidad contenida en el JWT vigente.' })
  me(@CurrentAuthUser() claims: AccessTokenClaims): AccessTokenClaims {
    return claims;
  }

  private setRefreshCookie(response: Response, refreshToken: string): void {
    response.cookie(this.cookieName, refreshToken, {
      ...this.cookieOptions(),
      maxAge: this.refreshTtlSeconds * 1000,
    });
  }

  private cookieOptions() {
    return {
      httpOnly: true,
      secure: this.cookieSecure,
      sameSite: 'lax' as const,
      path: '/api/v1/auth',
    };
  }

  private readCookie(request: Request, name: string): string | null {
    const raw = request.headers.cookie;
    if (!raw) {
      return null;
    }

    for (const segment of raw.split(';')) {
      const [cookieName, ...valueParts] = segment.trim().split('=');
      if (cookieName === name) {
        return decodeURIComponent(valueParts.join('='));
      }
    }
    return null;
  }

  private getUserAgent(request: Request): string | null {
    const value = request.headers['user-agent'];
    return typeof value === 'string' ? value.slice(0, 300) : null;
  }

  private toPublicResult(result: InternalAuthSessionResult): AuthSessionResult {
    return {
      usuario: result.usuario,
      accessToken: result.accessToken,
      fechaInicio: result.fechaInicio,
      expiresInSeconds: result.expiresInSeconds,
    };
  }
}
