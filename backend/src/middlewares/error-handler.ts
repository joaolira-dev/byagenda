import type { ErrorRequestHandler } from 'express';

import { Prisma } from '../generated/prisma/client.js';
import { AppError } from '../errors/app-error.js';

export const errorHandler: ErrorRequestHandler = (
  error,
  _request,
  response,
  _next,
) => {
  if (error instanceof AppError) {
    response.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
        ...(error.details === undefined ? {} : { details: error.details }),
      },
    });
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      response.status(409).json({
        error: {
          code: 'RESOURCE_CONFLICT',
          message: 'Ja existe um recurso com estes dados',
        },
      });
      return;
    }

    if (error.code === 'P2025') {
      response.status(404).json({
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'Recurso nao encontrado',
        },
      });
      return;
    }
  }

  console.error(error);
  response.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Erro interno do servidor',
    },
  });
};
