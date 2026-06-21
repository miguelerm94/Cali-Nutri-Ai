import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorCode } from '@cali-nutri/shared-types';

/**
 * Formato canónico de error de TODA la API.
 * Fuente: BackendArchitecture.md §19 "Formato Canónico de Error".
 *
 * {
 *   success: false,
 *   error: { code, message, details? },
 *   meta: { timestamp, request_id, version }
 * }
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const body = exception.getResponse();

    const code =
      typeof body === 'object' && body !== null && 'code' in body
        ? (body as { code: string }).code
        : this.codeFromStatus(status);

    const message =
      typeof body === 'object' && body !== null && 'message' in body
        ? (body as { message: string | string[] }).message
        : exception.message;

    const details =
      typeof body === 'object' && body !== null && 'details' in body
        ? (body as { details: unknown }).details
        : undefined;

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `[${(request as any).requestId ?? 'no-request-id'}] ${request.method} ${request.url} → ${status}`,
        exception.stack,
      );
    }

    response.status(status).json({
      success: false,
      error: {
        code,
        message: Array.isArray(message) ? message.join(', ') : message,
        ...(details ? { details } : {}),
      },
      meta: {
        timestamp: new Date().toISOString(),
        request_id: (request as any).requestId ?? 'unknown',
        version: process.env.API_VERSION ?? '1',
      },
    });
  }

  private codeFromStatus(status: number): ErrorCode {
    switch (status) {
      case HttpStatus.UNAUTHORIZED:
        return ErrorCode.INVALID_TOKEN;
      case HttpStatus.FORBIDDEN:
        return ErrorCode.FORBIDDEN;
      case HttpStatus.NOT_FOUND:
        return ErrorCode.RESOURCE_NOT_FOUND;
      case HttpStatus.CONFLICT:
        return ErrorCode.EMAIL_ALREADY_EXISTS;
      case HttpStatus.TOO_MANY_REQUESTS:
        return ErrorCode.RATE_LIMIT_EXCEEDED;
      case HttpStatus.REQUEST_TIMEOUT:
        return ErrorCode.REQUEST_TIMEOUT;
      default:
        return ErrorCode.INTERNAL_ERROR;
    }
  }
}
