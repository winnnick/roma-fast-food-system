import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

export const CORRELATION_ID_HEADER = 'x-correlation-id';

export function correlationIdMiddleware(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  const received = request.header(CORRELATION_ID_HEADER)?.trim();
  const correlationId = received && received.length <= 128 ? received : randomUUID();

  response.setHeader(CORRELATION_ID_HEADER, correlationId);
  response.locals.correlationId = correlationId;

  next();
}
