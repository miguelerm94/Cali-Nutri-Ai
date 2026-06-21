import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { ulid } from 'ulid';

/**
 * Primer middleware en la cadena. Genera request_id ULID y lo adjunta a:
 * req.requestId, header X-Request-ID. Fuente: BackendArchitecture.md §10.
 */
@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const requestId = ulid();
    (req as any).requestId = requestId;
    res.setHeader('X-Request-ID', requestId);
    next();
  }
}
