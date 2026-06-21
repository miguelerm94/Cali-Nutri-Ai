import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { ulid } from 'ulid';

/** Propaga/genera X-Correlation-ID para trazar flujos multi-servicio (BackendArchitecture.md §10). */
@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const incoming = req.headers['x-correlation-id'];
    const correlationId = (Array.isArray(incoming) ? incoming[0] : incoming) ?? ulid();
    (req as any).correlationId = correlationId;
    res.setHeader('X-Correlation-ID', correlationId);
    next();
  }
}
