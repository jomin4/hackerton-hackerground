import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';

import { HttpError } from '../lib/http-error.js';
import type { Logger } from 'pino';

export function createErrorHandler(logger: Logger): ErrorRequestHandler {
  return (error: unknown, request, response, next) => {
    if (response.headersSent) {
      next(error);
      return;
    }

    if (error instanceof ZodError) {
      const details = error.issues.map((issue) => {
        const field = issue.path.join('.') || 'query';
        const value = request.query[field];
        return {
          field,
          value: value === undefined ? null : value,
          issue: issue.message,
        };
      });

      response.status(400).json({
        error: {
          code: 'INVALID_QUERY',
          message: error.issues[0]?.message ?? '요청 값이 올바르지 않아요.',
          details,
        },
      });
      return;
    }

    if (error instanceof HttpError) {
      if (error.status >= 500) {
        logger.error({ err: error }, 'HTTP request failed');
      }

      response.status(error.status).json({
        error: {
          code: error.code,
          message: error.message,
          ...(error.details === undefined ? {} : { details: error.details }),
        },
      });
      return;
    }

    logger.error({ err: error }, 'Unhandled request error');
    response.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: '서버에서 오류가 발생했어요.',
      },
    });
  };
}
