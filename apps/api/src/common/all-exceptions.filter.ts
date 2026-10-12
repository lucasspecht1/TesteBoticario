import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Request, Response } from 'express';

const PRISMA_STATUS: Record<string, { status: number; message: string }> = {
  P2002: { status: 409, message: 'Registro duplicado.' },
  P2025: { status: 404, message: 'Registro não encontrado.' },
};

/** Formato único de erro: { statusCode, message, details?, path, timestamp }. */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Erro');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    let status = 500;
    let message = 'Erro interno. Tente novamente em instantes.';
    let details: unknown;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'string') message = body;
      else {
        const b = body as { message?: string | string[]; details?: unknown };
        message = Array.isArray(b.message) ? b.message.join('; ') : (b.message ?? message);
        details = b.details;
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError && PRISMA_STATUS[exception.code]) {
      ({ status, message } = PRISMA_STATUS[exception.code]);
    }

    if (status >= 500) this.logger.error(exception instanceof Error ? exception.stack : exception);
    res.status(status).json({ statusCode: status, message, details, path: req.url, timestamp: new Date().toISOString() });
  }
}
